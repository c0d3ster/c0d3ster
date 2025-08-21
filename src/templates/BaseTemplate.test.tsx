import { page } from '@vitest/browser/context'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { BaseTemplate } from './BaseTemplate'

describe('Base template', () => {
  describe('Render method', () => {
    it('should have 3 menu items', () => {
      render(
        <BaseTemplate
          leftNav={
            <>
              <li>link 1</li>
              <li>link 2</li>
              <li>link 3</li>
            </>
          }
        >
          {null}
        </BaseTemplate>
      )

      const menuItemList = page.getByRole('listitem')

      expect(menuItemList.elements()).toHaveLength(3)
    })

    it('should have a link to support creativedesignsguru.com', () => {
      render(<BaseTemplate leftNav={<li>1</li>}>{null}</BaseTemplate>)

      const copyrightSection = page.getByText(/© Copyright/)
      const copyrightLink = copyrightSection.getByRole('link')

      /*
       * PLEASE READ THIS SECTION
       * We'll really appreciate if you could have a link to our website
       * The link doesn't need to appear on every pages, one link on one page is enough.
       * Thank you for your support it'll mean a lot for us.
       */
      expect(copyrightLink).toHaveAttribute(
        'href',
        'https://creativedesignsguru.com'
      )
    })
  })
})
