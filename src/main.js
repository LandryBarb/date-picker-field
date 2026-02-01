import './styles/main.scss'

import datePickerHtml from './components/date-picker-field/date-picker-field.html?raw'
import './components/date-picker-field/date-picker-field.scss'
import { createDatePickerField } from './components/date-picker-field/date-picker-field.js'

const demo = document.querySelector('#demo')
if (!demo) throw new Error('Demo container not found')

demo.innerHTML = datePickerHtml

createDatePickerField(demo, {
  initialMonthISO: '2026-01',
  defaultValue: '2026-01-15',
  constraints: {
    clearable: true,
    minDate: '2026-01-01',
    maxDate: '2026-12-31',
  },
})
