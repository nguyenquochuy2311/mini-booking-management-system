import { useForm } from 'react-hook-form'
import { useBooking } from '../context/BookingContext'
import { toast } from '../lib/toast'
import { LogOutIcon } from './icons'

export function LoginForm() {
  const { isAuthenticated, login, logout } = useBooking()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: 'admin@example.com', password: 'password' } })

  if (isAuthenticated) {
    return (
      <div className="auth-bar">
        <div className="auth-chip">
          <span className="avatar" aria-hidden="true">
            A
          </span>
          <span className="muted" data-testid="auth-status">
            Signed in as admin
          </span>
        </div>
        <button type="button" className="btn btn-ghost logout-button" onClick={logout} data-testid="logout-button">
          <LogOutIcon width={16} height={16} />
          <span className="btn-label">Log out</span>
        </button>
      </div>
    )
  }

  const onSubmit = async (values) => {
    try {
      await login(values)
      toast.success('Welcome back')
    } catch (error) {
      const message = error.response?.data?.errors?.email?.[0] ?? 'Login failed.'
      setError('root', { type: 'server', message })
    }
  }

  return (
    <form className="auth-bar login-bar" onSubmit={handleSubmit(onSubmit)} noValidate data-testid="login-form">
      <input
        type="email"
        className="input input-sm"
        placeholder="Email"
        aria-label="Email"
        {...register('email', { required: true })}
        data-testid="login-email-input"
      />
      <input
        type="password"
        className="input input-sm"
        placeholder="Password"
        aria-label="Password"
        {...register('password', { required: true })}
        data-testid="login-password-input"
      />
      <button type="submit" className="btn btn-primary" disabled={isSubmitting} data-testid="login-submit">
        {isSubmitting ? 'Signing in…' : 'Log in'}
      </button>
      {errors.root && (
        <span className="field-error" role="alert" data-testid="login-error">
          {errors.root.message}
        </span>
      )}
    </form>
  )
}
