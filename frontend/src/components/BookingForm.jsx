import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useBooking } from '../context/BookingContext'
import { toast } from '../lib/toast'
import { AlertIcon, PlusIcon } from './icons'

// A datetime-local value ("YYYY-MM-DDTHH:mm") is wall-clock time; convert to a
// UTC ISO-8601 string for the API.
const toIso = (localValue) => (localValue ? new Date(localValue).toISOString() : '')

function FieldError({ id, message }) {
  if (!message) return null
  return (
    <span className="field-error" id={id} role="alert" data-testid={id}>
      <AlertIcon width={13} height={13} />
      {message}
    </span>
  )
}

export function BookingForm({ onSuccess }) {
  const { selectedRoomId, isAuthenticated, createBooking, setDraft } = useBooking()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { user_name: '', start_time: '', end_time: '' },
  })

  // Mirror the form into the shared draft so the list can show a live preview.
  // watch() is RHF's documented subscription API (deliberately not memoized).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/incompatible-library
    const sub = watch((values) => setDraft(values))
    return () => sub.unsubscribe()
  }, [watch, setDraft])

  if (!isAuthenticated) {
    return (
      <div className="form-card form-card-muted">
        <p className="muted">Log in as an admin to create bookings.</p>
      </div>
    )
  }

  if (!selectedRoomId) {
    return (
      <div className="form-card form-card-muted">
        <p className="muted">Select a room to create a booking.</p>
      </div>
    )
  }

  const onSubmit = async (values) => {
    try {
      await createBooking({
        room_id: selectedRoomId,
        user_name: values.user_name,
        start_time: toIso(values.start_time),
        end_time: toIso(values.end_time),
      })
      reset()
      setDraft(null)
      toast.success('Booking created')
      onSuccess?.()
    } catch (error) {
      const serverErrors = error.response?.data?.errors
      if (serverErrors) {
        // Map Laravel's field-keyed 422 errors onto the form (focus the first).
        Object.entries(serverErrors).forEach(([field, messages], index) => {
          const target = field === 'room_id' ? 'root' : field
          setError(target, { type: 'server', message: messages[0] }, { shouldFocus: index === 0 })
        })
      } else {
        setError('root', { type: 'server', message: 'Something went wrong. Please try again.' })
      }
    }
  }

  return (
    <form className="form-card booking-form" onSubmit={handleSubmit(onSubmit)} noValidate data-testid="booking-form">
      <div className="form-head">
        <span className="form-head-icon" aria-hidden="true">
          <PlusIcon width={16} height={16} />
        </span>
        <h3>New booking</h3>
      </div>

      <label className="field">
        <span className="field-label">Name</span>
        <input
          type="text"
          className="input"
          placeholder="e.g. Jane Doe"
          {...register('user_name', { required: 'Name is required' })}
          aria-invalid={Boolean(errors.user_name)}
          aria-describedby={errors.user_name ? 'booking-name-error' : undefined}
          data-testid="booking-name-input"
        />
        <FieldError id="booking-name-error" message={errors.user_name?.message} />
      </label>

      <label className="field">
        <span className="field-label">Start time</span>
        <input
          type="datetime-local"
          className="input"
          {...register('start_time', { required: 'Start time is required' })}
          aria-invalid={Boolean(errors.start_time)}
          aria-describedby={errors.start_time ? 'booking-start-error' : undefined}
          data-testid="booking-start-input"
        />
        <FieldError id="booking-start-error" message={errors.start_time?.message} />
      </label>

      <label className="field">
        <span className="field-label">End time</span>
        <input
          type="datetime-local"
          className="input"
          {...register('end_time', {
            required: 'End time is required',
            validate: (value, form) =>
              !value || !form.start_time || new Date(value) > new Date(form.start_time) ||
              'End time must be after start time',
          })}
          aria-invalid={Boolean(errors.end_time)}
          aria-describedby={errors.end_time ? 'booking-end-error' : undefined}
          data-testid="booking-end-input"
        />
        <FieldError id="booking-end-error" message={errors.end_time?.message} />
      </label>

      {errors.root && (
        <p className="field-error" role="alert" data-testid="booking-form-error">
          <AlertIcon width={13} height={13} />
          {errors.root.message}
        </p>
      )}

      <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting} data-testid="booking-submit">
        {isSubmitting ? 'Saving…' : 'Create booking'}
      </button>
    </form>
  )
}
