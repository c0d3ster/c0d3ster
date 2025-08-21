import z from 'zod'

// Project request form validation schema
export const projectRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description too long'),
  projectType: z.enum(
    [
      'website',
      'web_app',
      'mobile_app',
      'e_commerce',
      'api',
      'maintenance',
      'consultation',
      'other',
    ],
    { message: 'Please select a project type' }
  ),
  budget: z
    .string()
    .optional()
    .refine((val) => !val || (!Number.isNaN(Number(val)) && Number(val) >= 0), {
      message: 'Budget must be a non-negative number',
    }),
  timeline: z.string().max(100, 'Timeline too long').optional(),
  contactPreference: z
    .enum(['email', 'phone', 'video_call', 'in_person'], {
      message: 'Please select a contact preference',
    })
    .optional(),
  additionalInfo: z.string().max(1000, 'Additional info too long').optional(),
  requirements: z
    .object({
      hasDesign: z.boolean().optional(),
      needsHosting: z.boolean().optional(),
      needsDomain: z.boolean().optional(),
      needsMaintenance: z.boolean().optional(),
      needsContentCreation: z.boolean().optional(),
      needsSEO: z.boolean().optional(),
      features: z.array(z.string()).optional(),
    })
    .optional(),
})

// Infer the TypeScript type from the schema
export type ProjectRequestData = z.infer<typeof projectRequestSchema>

// Project type options for the form
export const projectTypeOptions = [
  { value: 'website', label: 'Website' },
  { value: 'web_app', label: 'Web Application' },
  { value: 'mobile_app', label: 'Mobile App' },
  { value: 'e_commerce', label: 'E-commerce Store' },
  { value: 'api', label: 'API Development' },
  { value: 'maintenance', label: 'Website Maintenance' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'other', label: 'Other' },
] as const

// Contact preference options
export const contactPreferenceOptions = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone Call' },
  { value: 'video_call', label: 'Video Call' },
  { value: 'in_person', label: 'In Person' },
] as const
