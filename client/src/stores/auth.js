import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const STORE_VERSION = 'v3'
  if (localStorage.getItem('hris_users_version') !== STORE_VERSION) {
    localStorage.removeItem('hris_users')
    localStorage.setItem('hris_users_version', STORE_VERSION)
  }

  const storedUsers = JSON.parse(localStorage.getItem('hris_users') || 'null')
  const users = ref(storedUsers || [
    { id: 1, username: 'superadmin', password: 'superadmin123', name: 'Super Admin', role: 'Super Admin', department: 'Human Resources' },
    { id: 2, username: 'admin',      password: 'admin123',      name: 'HR Admin',    role: 'Admin',       department: 'Human Resources' },
  ])
  if (!storedUsers) localStorage.setItem('hris_users', JSON.stringify(users.value))

  const currentUser = ref(JSON.parse(sessionStorage.getItem('hris_user') || 'null'))
  const loginError  = ref('')
  const signupError = ref('')

  const isLoggedIn = computed(() => !!currentUser.value)

  // Role helpers
  const userRole = computed(() => currentUser.value?.role ?? '')
  const isSectionAdmin = computed(() => userRole.value === 'Section Admin')
  const isIT           = computed(() => userRole.value === 'IT')
  const isFullAccess   = computed(() =>
    ['Super Admin', 'Admin', 'IT'].includes(userRole.value)
  )

  // Section Admin can edit only in Schedule Database
  function canEdit(section = '') {
    if (['Super Admin', 'Admin', 'IT'].includes(userRole.value)) return true
    if (userRole.value === 'Section Admin' && section === 'schedule') return true
    return false
  }

  const activityLog = ref(JSON.parse(sessionStorage.getItem('hris_log') || '[]'))

  function login(username, password) {
    loginError.value = ''
    const user = users.value.find(u => u.username === username && u.password === password)
    if (user) {
      const { password: _p, ...safeUser } = user
      currentUser.value = safeUser
      sessionStorage.setItem('hris_user', JSON.stringify(safeUser))
      addLog('Login', 'Auth', `${safeUser.name} logged in.`)
      return true
    }
    loginError.value = 'Invalid username or password.'
    return false
  }

  function signup(data) {
    signupError.value = ''
    if (!data.username || !data.password || !data.name) {
      signupError.value = 'Username, password, and full name are required.'
      return false
    }
    if (data.password.length < 6) {
      signupError.value = 'Password must be at least 6 characters.'
      return false
    }
    if (data.password !== data.confirmPassword) {
      signupError.value = 'Passwords do not match.'
      return false
    }
    if (users.value.find(u => u.username.toLowerCase() === data.username.toLowerCase())) {
      signupError.value = 'Username already exists. Please choose another.'
      return false
    }

    const newUser = {
      id: Date.now(),
      username:   data.username,
      password:   data.password,
      name:       data.name,
      role:       data.role || 'Admin',
      department: data.department || 'Human Resources',
    }
    users.value.push(newUser)
    localStorage.setItem('hris_users', JSON.stringify(users.value))
    addLog('Sign Up', 'Auth', `New user ${newUser.name} (${newUser.username}) registered.`)
    return true
  }

  function updateProfile(data) {
    const idx = users.value.findIndex(u => u.id === currentUser.value?.id)
    if (idx !== -1) {
      users.value[idx] = { ...users.value[idx], ...data }
      localStorage.setItem('hris_users', JSON.stringify(users.value))
      const { password: _p, ...safeUser } = users.value[idx]
      currentUser.value = safeUser
      sessionStorage.setItem('hris_user', JSON.stringify(safeUser))
      addLog('Profile Updated', 'Auth', `${safeUser.name} updated their profile.`)
    }
  }

  function logout() {
    if (currentUser.value) {
      addLog('Logout', 'Auth', `${currentUser.value.name} logged out.`)
    }
    currentUser.value = null
    sessionStorage.removeItem('hris_user')
  }

  function addLog(action, module, details) {
    const entry = {
      id:        Date.now(),
      timestamp: new Date().toLocaleString('en-PH', { hour12: true }),
      user:      currentUser.value?.name || 'System',
      action, module, details,
      status: 'OK',
    }
    activityLog.value.unshift(entry)
    if (activityLog.value.length > 200) activityLog.value = activityLog.value.slice(0, 200)
    sessionStorage.setItem('hris_log', JSON.stringify(activityLog.value))
  }

  return {
    currentUser, isLoggedIn, loginError, signupError,
    activityLog, users, userRole, isSectionAdmin, isIT, isFullAccess, canEdit,
    login, signup, logout, updateProfile, addLog,
  }
})
