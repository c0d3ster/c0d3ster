/* eslint-disable no-console -- the eval reports its results to the terminal */
import 'reflect-metadata'
import { GraphQLError } from 'graphql'
import { describe, expect, it } from 'vitest'

import type { ProjectType } from '@/graphql/schema';

import { ProjectFeature } from '@/graphql/schema'
import { ProjectInferenceService } from '@/services/ProjectInferenceService'

import type { InferenceCase } from './projectInference.cases'

import { inferenceCases } from './projectInference.cases'

// Live eval against the real Anthropic API. Run with: pnpm eval:inference
// Knobs: EVAL_RUNS (repeats per case, default 3), EVAL_ONLY (comma separated case ids),
//        EVAL_MIN_TYPE_ACCURACY (default 0.8), EVAL_MIN_REQUIRED_RECALL (default 0.7),
//        EVAL_MAX_FORBIDDEN_RATE (share of runs that pick a forbidden feature, default 0.1)

const RUNS = Number(process.env.EVAL_RUNS ?? 3)
const MIN_TYPE_ACCURACY = Number(process.env.EVAL_MIN_TYPE_ACCURACY ?? 0.8)
const MIN_REQUIRED_RECALL = Number(process.env.EVAL_MIN_REQUIRED_RECALL ?? 0.7)
const MAX_FORBIDDEN_RATE = Number(process.env.EVAL_MAX_FORBIDDEN_RATE ?? 0.1)
const ONLY = process.env.EVAL_ONLY?.split(',').map((id) => id.trim())
const MAX_TITLE_LENGTH = 60

type Success = {
  ok: true
  projectType: ProjectType
  features: ProjectFeature[]
  title: string
}

type RunOutcome = Success | { ok: false; errorCode: string }

type RunScore = {
  typeHit: boolean
  requiredHits: number
  forbiddenHits: ProjectFeature[]
  noise: ProjectFeature[]
  longTitle: boolean
}

type CaseReport = {
  testCase: InferenceCase
  runs: number
  successes: Success[]
  errors: string[]
  scores: RunScore[]
}

const service = new ProjectInferenceService()

const runOnce = async (testCase: InferenceCase): Promise<RunOutcome> => {
  try {
    const result = await service.inferProjectDetails({
      projectName: testCase.projectName,
      description: testCase.description,
    })
    return { ok: true, ...result }
  } catch (error) {
    const code = error instanceof GraphQLError ? error.extensions.code : null
    return {
      ok: false,
      errorCode: typeof code === 'string' ? code : String(error),
    }
  }
}

const ratio = (num: number, den: number): number => (den === 0 ? 1 : num / den)

const mean = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length

const scoreRun = (testCase: InferenceCase, run: Success): RunScore => {
  const required = testCase.requiredFeatures
  const acceptable = testCase.acceptableFeatures ?? []
  const forbidden = testCase.forbiddenFeatures ?? []

  return {
    typeHit: testCase.acceptableTypes.includes(run.projectType),
    requiredHits: run.features.filter((feature) => required.includes(feature))
      .length,
    forbiddenHits: run.features.filter((feature) => forbidden.includes(feature)),
    noise: run.features.filter(
      (feature) =>
        !required.includes(feature) &&
        !acceptable.includes(feature) &&
        !forbidden.includes(feature)
    ),
    longTitle: run.title.length > MAX_TITLE_LENGTH,
  }
}

const evaluateCase = async (testCase: InferenceCase): Promise<CaseReport> => {
  const outcomes = await Promise.all(
    Array.from({ length: RUNS }, () => runOnce(testCase))
  )
  const successes = outcomes.filter(
    (outcome): outcome is Success => outcome.ok
  )
  const errors = outcomes.flatMap((outcome) =>
    outcome.ok ? [] : [outcome.errorCode]
  )

  return {
    testCase,
    runs: RUNS,
    successes,
    errors,
    scores: successes.map((run) => scoreRun(testCase, run)),
  }
}

const caseRecall = (report: CaseReport): number =>
  mean(
    report.scores.map((score) =>
      ratio(score.requiredHits, report.testCase.requiredFeatures.length)
    )
  )

// "feature (2/3)" lists, most frequently picked first
const tally = (items: string[], runs: number): string =>
  Object.entries(
    items.reduce<Record<string, number>>((counts, item) => {
      counts[item] = (counts[item] ?? 0) + 1
      return counts
    }, {})
  )
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([item, count]) => (count === runs ? item : `${item} (${count}/${runs})`))
    .join(', ') || '-'

const describeCase = (report: CaseReport): string => {
  const { testCase, successes, runs } = report
  const types = tally(
    successes.map((run) => run.projectType),
    runs
  )
  const missed = tally(
    successes.flatMap((run) =>
      testCase.requiredFeatures.filter(
        (feature) => !run.features.includes(feature)
      )
    ),
    runs
  )
  return [
    `${testCase.id} [${testCase.tag ?? 'clear'}]`,
    `  type:      ${types}  (accepted: ${testCase.acceptableTypes.join(', ')})`,
    `  picked:    ${tally(
      successes.flatMap((run) => run.features),
      runs
    )}`,
    `  missed:    ${missed}`,
    `  forbidden: ${tally(
      report.scores.flatMap((score) => score.forbiddenHits),
      runs
    )}`,
    `  noise:     ${tally(
      report.scores.flatMap((score) => score.noise),
      runs
    )}`,
    `  title:     ${successes[0]?.title ?? '-'}`,
    ...(report.errors.length > 0
      ? [`  errors:    ${tally(report.errors, runs)}`]
      : []),
  ].join('\n')
}

type FeatureStat = { expected: number; hit: number; picked: number; bad: number }

// Per feature: how often it was required and found, how often picked at all, how often picked wrongly
const featureStats = (reports: CaseReport[]): Map<ProjectFeature, FeatureStat> => {
  const stats = new Map<ProjectFeature, FeatureStat>(
    Object.values(ProjectFeature).map((feature) => [
      feature,
      { expected: 0, hit: 0, picked: 0, bad: 0 },
    ])
  )

  for (const report of reports) {
    const { testCase, successes } = report
    const okFeatures = [
      ...testCase.requiredFeatures,
      ...(testCase.acceptableFeatures ?? []),
    ]
    for (const run of successes) {
      for (const feature of testCase.requiredFeatures) {
        const stat = stats.get(feature)
        if (!stat) continue
        stat.expected += 1
        if (run.features.includes(feature)) stat.hit += 1
      }
      for (const feature of run.features) {
        const stat = stats.get(feature)
        if (!stat) continue
        stat.picked += 1
        if (!okFeatures.includes(feature)) stat.bad += 1
      }
    }
  }
  return stats
}

describe.skipIf(!process.env.ANTHROPIC_API_KEY)(
  'project inference eval',
  () => {
    it('classifies type and features accurately and consistently', async () => {
      const cases = inferenceCases.filter(
        (testCase) => !ONLY || ONLY.includes(testCase.id)
      )

      // Cases run sequentially (repeats within a case run in parallel) to stay under rate limits
      const reports: CaseReport[] = []
      for (const testCase of cases) {
        reports.push(await evaluateCase(testCase))
      }

      console.log(reports.map(describeCase).join('\n\n'))

      console.table(
        reports.map((report) => ({
          case: report.testCase.id,
          'type ok': `${report.scores.filter((s) => s.typeHit).length}/${report.runs}`,
          'req recall': caseRecall(report).toFixed(2),
          'forbidden runs': report.scores.filter(
            (score) => score.forbiddenHits.length > 0
          ).length,
          'avg noise': mean(report.scores.map((s) => s.noise.length)).toFixed(1),
          'avg picked': mean(report.successes.map((r) => r.features.length)).toFixed(1),
          errors: report.errors.length,
        }))
      )

      console.table(
        Object.fromEntries(
          [...featureStats(reports).entries()].map(([feature, stat]) => [
            feature,
            {
              recall:
                stat.expected === 0
                  ? 'n/a'
                  : `${stat.hit}/${stat.expected}`,
              picked: stat.picked,
              'picked outside ok set': stat.bad,
            },
          ])
        )
      )

      const allScores = reports.flatMap((report) => report.scores)
      const totalRuns = reports.reduce((sum, report) => sum + report.runs, 0)
      const typeAccuracy = ratio(
        allScores.filter((score) => score.typeHit).length,
        totalRuns
      )
      const withRequired = reports.filter(
        (report) => report.testCase.requiredFeatures.length > 0
      )
      const requiredRecall = mean(withRequired.map(caseRecall))
      const forbiddenRate = ratio(
        allScores.filter((score) => score.forbiddenHits.length > 0).length,
        totalRuns
      )
      const flaky = reports.filter(
        (report) =>
          new Set(report.successes.map((run) => run.projectType)).size > 1
      )
      const errored = reports.filter((report) => report.errors.length > 0)

      console.log(
        [
          `type accuracy: ${(typeAccuracy * 100).toFixed(1)}% over ${totalRuns} runs`,
          `required feature recall: ${requiredRecall.toFixed(2)} (${withRequired.length} cases with required features)`,
          `runs with a forbidden feature: ${(forbiddenRate * 100).toFixed(1)}%`,
          `avg features picked per run: ${mean(reports.flatMap((r) => r.successes.map((s) => s.features.length))).toFixed(1)}, avg noise per run: ${mean(allScores.map((s) => s.noise.length)).toFixed(1)}`,
          `flaky cases (type changed between runs): ${flaky.map((r) => r.testCase.id).join(', ') || 'none'}`,
          `cases with errors (malformed or failed): ${errored.map((r) => `${r.testCase.id}(${r.errors.length})`).join(', ') || 'none'}`,
          `titles over ${MAX_TITLE_LENGTH} chars: ${allScores.filter((s) => s.longTitle).length}`,
        ].join('\n')
      )

      expect(typeAccuracy).toBeGreaterThanOrEqual(MIN_TYPE_ACCURACY)
      expect(requiredRecall).toBeGreaterThanOrEqual(MIN_REQUIRED_RECALL)
      expect(forbiddenRate).toBeLessThanOrEqual(MAX_FORBIDDEN_RATE)
    })
  }
)
