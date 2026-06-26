import { useNavigate } from 'react-router-dom'
import { HttpError, setHttpErrorHandler } from '../utils/httpClient'
import { getTokenRole, getHomeByRole } from '../utils/auth'

export function useHttpErrorHandler() {
  const navigate = useNavigate()

  const handleHttpError = async (error: HttpError) => {
    switch (error.status) {
      case 401: {
        localStorage.removeItem('token')
        navigate('/login', { replace: true })
        break
      }
      case 403: {
        const role = getTokenRole()
        navigate(getHomeByRole(role), { replace: true })
        break
      }
      case 404: {
        navigate('/not-found', { replace: true })
        break
      }
    }
  }

  // Set the global error handler
  setHttpErrorHandler(handleHttpError)

  return { handleHttpError }
}
