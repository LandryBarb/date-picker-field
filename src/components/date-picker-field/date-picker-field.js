/**
 * Date Picker Field (vanilla)
 * Scaffold only. No ARIA attributes. No keyboard logic beyond TODO placeholders.
 */

export function createDatePickerField(root, config) {
  if (!root) throw new Error('DatePickerField root is required')

  const el = {
    control: root.querySelector('[data-el="control"]'),
    valueText: root.querySelector('[data-el="valueText"]'),
    clear: root.querySelector('[data-el="clear"]'),
    help: root.querySelector('[data-el="help"]'),
    status: root.querySelector('[data-el="status"]'),
    error: root.querySelector('[data-el="error"]'),
    panel: root.querySelector('[data-el="panel"]'),
    monthLabel: root.querySelector('[data-el="monthLabel"]'),
    weekdayRow: root.querySelector('[data-el="weekdayRow"]'),
    dateGrid: root.querySelector('[data-el="dateGrid"]'),
    prevMonth: root.querySelector('[data-el="prevMonth"]'),
    nextMonth: root.querySelector('[data-el="nextMonth"]'),
    dismiss: root.querySelector('[data-el="dismiss"]'),
    confirm: root.querySelector('[data-el="confirm"]'),
  }

  /** Controlled vs uncontrolled state */
  const isValueControlled = Object.prototype.hasOwnProperty.call(config, 'value')
  const isOpenControlled = Object.prototype.hasOwnProperty.call(config, 'open')

  const state = {
    value: isValueControlled ? (config.value ?? null) : (config.defaultValue ?? null),
    open: isOpenControlled ? Boolean(config.open) : false,

    activeMonthISO: config.initialMonthISO || '2026-01', // TODO: derive initial month from value or "today"
    candidateISO: null, // TODO: only used if preview-then-commit

    focused: false,
    touched: false,
  }

  /** Utilities */
  function setStateFlag(flag) {
    root.dataset.state = flag
  }

  function setOpen(next, ctx) {
    if (!isOpenControlled) state.open = next
    el.panel.hidden = !next

    if (typeof config.onOpenChange === 'function') {
      config.onOpenChange(next, ctx)
    }
  }

  function setValue(next, ctx) {
    if (!isValueControlled) state.value = next
    if (typeof config.onChange === 'function') {
      config.onChange(next, ctx)
    }
    renderValue()
    renderClear()
  }

  function renderValue() {
    const v = isValueControlled ? (config.value ?? null) : state.value
    el.valueText.textContent = v || ''
  }

  function renderClear() {
    const v = isValueControlled ? (config.value ?? null) : state.value
    const clearable = Boolean(config.constraints && config.constraints.clearable)
    const interactive = !config.disabled && !config.readOnly
    el.clear.hidden = !(clearable && interactive && Boolean(v))
  }

  function renderSupport() {
    const msg = config.messages || {}

    if (msg.helpText) {
      el.help.hidden = false
      el.help.textContent = msg.helpText
    } else {
      el.help.hidden = true
      el.help.textContent = ''
    }

    if (msg.statusText) {
      el.status.hidden = false
      el.status.textContent = msg.statusText
    } else {
      el.status.hidden = true
      el.status.textContent = ''
    }

    if (msg.errorText) {
      el.error.hidden = false
      el.error.textContent = msg.errorText
      setStateFlag('error')
    } else {
      el.error.hidden = true
      el.error.textContent = ''
      setStateFlag(state.open ? 'open' : (state.focused ? 'focused' : 'default'))
    }
  }

  function getDateCellState(iso) {
    const map = config.constraints && config.constraints.dateStateByISO
    if (map && map[iso]) return map[iso]

    const min = config.constraints && config.constraints.minDate
    const max = config.constraints && config.constraints.maxDate
    // TODO: human decision. ISO lexical compare assumes zero padding and valid dates.
    if (min && iso < min) return 'out_of_range'
    if (max && iso > max) return 'out_of_range'
    return 'available'
  }

  function canCommitDate(iso) {
    const cellState = getDateCellState(iso)
    if (cellState === 'out_of_range') return { ok: false, reason: 'out_of_allowed_window' }
    if (cellState === 'unavailable') return { ok: false, reason: 'unavailable' }
    return { ok: true }
  }

  /** Calendar grid placeholders */
  function renderWeekdays() {
    // TODO: human decision. Generate weekday labels from locale + weekStartsOn.
    el.weekdayRow.innerHTML = ''
    ;['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach((d) => {
      const span = document.createElement('span')
      span.className = 'dp-panel__weekday'
      span.textContent = d
      el.weekdayRow.appendChild(span)
    })
  }

  function renderMonthLabel() {
    // TODO: human decision. Format month/year label with locale.
    el.monthLabel.textContent = state.activeMonthISO
  }

  function renderGrid() {
    el.dateGrid.innerHTML = ''

    // TODO: human decision. Generate actual month grid for state.activeMonthISO.
    // Placeholder: empty grid.
  }

  function navigate(nextMonthISO) {
    state.activeMonthISO = nextMonthISO
    if (typeof config.onNavigate === 'function') {
      config.onNavigate({ monthISO: nextMonthISO })
    }
    renderMonthLabel()
    renderGrid()

    // TODO (Interaction Model §3): allow exploration without committing selection
  }

  /** Event handlers */
  function onControlActivate() {
    if (config.disabled || config.readOnly) return
    // TODO (Interaction Model §2): explicit activation engages component
    const next = !state.open
    setOpen(next, { source: 'user' })
    setStateFlag(next ? 'open' : (state.focused ? 'focused' : 'default'))

    // TODO: when opening, decide which month to show (value month or current month)
    // TODO (Interaction Model §6): focus management within panel is a human decision
  }

  function onDismiss() {
    // TODO (Interaction Model §5): exit engaged state without changing selection
    setOpen(false, { source: 'user' })
    setStateFlag(state.focused ? 'focused' : 'default')

    // TODO (Interaction Model §6): return focus to field control
  }

  function onClear() {
    if (el.clear.hidden) return
    if (typeof config.onClear === 'function') config.onClear()
    setValue(null, { source: 'programmatic' }) // TODO: human decision. separate ctx for clear
  }

  function onDateActivate(iso) {
    if (config.disabled || config.readOnly) return
    if (config.isPageLoading) return

    const allowed = canCommitDate(iso)
    if (!allowed.ok) {
      if (typeof config.onInvalidSelection === 'function') {
        config.onInvalidSelection(iso, allowed.reason)
      }
      return
    }

    // TODO (Interaction Model §4): commit behavior decision
    // Option A: commit-on-select
    // setValue(iso, { source: 'calendar' })
    // setOpen(false, { source: 'user' })

    // Option B: preview-then-commit
    // state.candidateISO = iso
    // el.confirm.hidden = false
  }

  function onConfirm() {
    // TODO (Interaction Model §4): confirm commits candidate date
    if (!state.candidateISO) return
    setValue(state.candidateISO, { source: 'calendar' })
    state.candidateISO = null
    el.confirm.hidden = true
    setOpen(false, { source: 'user' })

    // TODO (Interaction Model §6): return focus to field control
  }

  function onFocus() {
    state.focused = true
    if (typeof config.onFocus === 'function') config.onFocus()
    if (!state.open) setStateFlag('focused')

    // TODO (Interaction Model §1): entry is a single stop when inactive
  }

  function onBlur() {
    state.focused = false
    state.touched = true
    if (typeof config.onBlur === 'function') config.onBlur()
    if (!state.open) setStateFlag('default')

    // TODO (Interaction Model §7): exiting restores normal tab sequence
  }

  /** Wiring */
  el.control.addEventListener('click', onControlActivate)
  el.control.addEventListener('focus', onFocus)
  el.control.addEventListener('blur', onBlur)

  el.dismiss.addEventListener('click', onDismiss)
  el.clear.addEventListener('click', onClear)
  el.confirm.addEventListener('click', onConfirm)

  el.prevMonth.addEventListener('click', () => {
    // TODO: implement month math
    navigate(state.activeMonthISO)
  })

  el.nextMonth.addEventListener('click', () => {
    // TODO: implement month math
    navigate(state.activeMonthISO)
  })

  // TODO (Interaction Model §3): keyboard navigation within panel placeholders (no implementation here)
  // TODO (Interaction Model §5): escape and outside click dismissal policy (human decision)

  /** Initial render */
  renderValue()
  renderClear()
  renderSupport()
  renderWeekdays()
  renderMonthLabel()
  renderGrid()

  /** Public API for consumer updates */
  return {
    /** Push new external config (for controlled props or message changes) */
    update(nextConfig) {
      config = { ...config, ...nextConfig }
      if (isValueControlled) {
        // value comes from config.value now
      }
      if (isOpenControlled) {
        state.open = Boolean(config.open)
        el.panel.hidden = !state.open
      }
      renderValue()
      renderClear()
      renderSupport()
      renderMonthLabel()
      renderGrid()
    },

    open() {
      setOpen(true, { source: 'programmatic' })
      setStateFlag('open')
    },

    close() {
      setOpen(false, { source: 'programmatic' })
      setStateFlag(state.focused ? 'focused' : 'default')
    },

    destroy() {
      el.control.removeEventListener('click', onControlActivate)
      el.control.removeEventListener('focus', onFocus)
      el.control.removeEventListener('blur', onBlur)
      el.dismiss.removeEventListener('click', onDismiss)
      el.clear.removeEventListener('click', onClear)
      el.confirm.removeEventListener('click', onConfirm)
    },
  }
}

/**
 * Optional: auto-init if you want a zero-config demo.
 * Remove for production integration.
 */
const autoRoot = document.querySelector('[data-component="DatePickerField"]')
if (autoRoot) {
  createDatePickerField(autoRoot, {
    messages: {
      helpText: '',
      statusText: '',
      errorText: '',
    },
    constraints: {
      clearable: true,
    },
    onChange: (value) => {
      // eslint-disable-next-line no-console
      console.log('change', value)
    },
  })
}
