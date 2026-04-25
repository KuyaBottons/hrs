<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

// Block access if account limit already reached
onMounted(() => {
  if (auth.accountLimitReached) {
    router.replace('/login')
  }
})

const form = ref({
  name: '',
  username: '',
  password: '',
  confirmPassword: '',
  role: 'Admin',
})

const showPassword = ref(false)
const showConfirm = ref(false)
const loading = ref(false)
const success = ref(false)
const fieldErrors = ref({})

const roles = ['Admin', 'Super Admin']

// Input restrictions
function onlyLetters(e) {
  if (!/^[a-zA-ZÀ-ÿ\s\-\.'ñÑ,]$/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab'].includes(e.key)) {
    e.preventDefault()
  }
}
function onlyAlphanumeric(e) {
  if (!/^[a-zA-Z0-9_]$/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab'].includes(e.key)) {
    e.preventDefault()
  }
}

// Password strength
const strengthScore = computed(() => {
  const p = form.value.password
  if (!p) return 0
  let score = 0
  if (p.length >= 6) score++
  if (p.length >= 10) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^a-zA-Z0-9]/.test(p)) score++
  return score
})
const strengthWidth = computed(() => ['0%','20%','40%','60%','80%','100%'][strengthScore.value])
const strengthColor = computed(() => ['#ccc','#c0392b','#e67e22','#f1c40f','#27ae60','#1a6b3c'][strengthScore.value])
const strengthLabel = computed(() => ['','Very Weak','Weak','Fair','Strong','Very Strong'][strengthScore.value])

function validate() {
  fieldErrors.value = {}
  if (!form.value.name.trim()) fieldErrors.value.name = 'Full name is required.'
  if (!form.value.username.trim()) fieldErrors.value.username = 'Username is required.'
  else if (form.value.username.length < 3) fieldErrors.value.username = 'At least 3 characters.'
  if (!form.value.password) fieldErrors.value.password = 'Password is required.'
  else if (form.value.password.length < 6) fieldErrors.value.password = 'At least 6 characters.'
  if (form.value.password !== form.value.confirmPassword) {
    fieldErrors.value.confirmPassword = 'Passwords do not match.'
  }
  return Object.keys(fieldErrors.value).length === 0
}

async function handleSignup() {
  auth.signupError = ''
  if (!validate()) return
  loading.value = true
  await new Promise(r => setTimeout(r, 600))
  const ok = auth.signup({
    name: form.value.name,
    username: form.value.username,
    password: form.value.password,
    confirmPassword: form.value.confirmPassword,
    role: form.value.role,
  })
  loading.value = false
  if (ok) {
    success.value = true
    setTimeout(() => router.push('/login'), 1800)
  }
}
</script>

<template>
  <div class="signup-page">
    <div class="signup-bg"></div>
    <div class="signup-card">
      <!-- Header -->
      <div class="signup-header">
        <img src="/GEAMH LOGO.png" alt="GEAMH Logo" class="signup-logo" />
        <h1>Create Account</h1>
        <p>General Emilio Aguinaldo Memorial Hospital</p>
        <span class="system-label">HRIS — New User Registration</span>
      </div>

      <!-- Success -->
      <div v-if="success" class="success-box">
        <div class="success-icon">✅</div>
        <h3>Account Created!</h3>
        <p>Redirecting to login page...</p>
      </div>

      <!-- Form -->
      <form v-else class="signup-form" @submit.prevent="handleSignup" novalidate>

        <div class="form-group">
          <label>Full Name <span class="req">*</span></label>
          <div class="input-wrapper" :class="{ 'has-error': fieldErrors.name }">
            <span class="input-icon">👤</span>
            <input v-model="form.name" type="text" placeholder="Last Name, First Name M."
              @keydown="onlyLetters" maxlength="80" :disabled="loading" />
          </div>
          <span v-if="fieldErrors.name" class="err-msg">{{ fieldErrors.name }}</span>
        </div>

        <div class="form-group">
          <label>Username <span class="req">*</span></label>
          <div class="input-wrapper" :class="{ 'has-error': fieldErrors.username }">
            <span class="input-icon">🔖</span>
            <input v-model="form.username" type="text" placeholder="e.g. jdelacruz"
              @keydown="onlyAlphanumeric" maxlength="30" autocomplete="username" :disabled="loading" />
          </div>
          <span v-if="fieldErrors.username" class="err-msg">{{ fieldErrors.username }}</span>
          <span v-else class="hint">Letters, numbers, underscores only. Min 3 characters.</span>
        </div>

        <div class="form-group">
          <label>Role</label>
          <div class="input-wrapper">
            <span class="input-icon">🎖️</span>
            <select v-model="form.role" :disabled="loading">
              <option v-for="r in roles" :key="r" :value="r">{{ r }}</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Password <span class="req">*</span></label>
          <div class="input-wrapper" :class="{ 'has-error': fieldErrors.password }">
            <span class="input-icon">🔒</span>
            <input v-model="form.password" :type="showPassword ? 'text' : 'password'"
              placeholder="Minimum 6 characters" maxlength="50"
              autocomplete="new-password" :disabled="loading" />
            <button type="button" class="show-pwd" @click="showPassword = !showPassword">
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
          <span v-if="fieldErrors.password" class="err-msg">{{ fieldErrors.password }}</span>
          <div v-if="form.password" class="strength-bar">
            <div class="strength-fill" :style="{ width: strengthWidth, background: strengthColor }"></div>
          </div>
          <span v-if="form.password" class="strength-label" :style="{ color: strengthColor }">
            {{ strengthLabel }}
          </span>
        </div>

        <div class="form-group">
          <label>Confirm Password <span class="req">*</span></label>
          <div class="input-wrapper" :class="{ 'has-error': fieldErrors.confirmPassword }">
            <span class="input-icon">🔒</span>
            <input v-model="form.confirmPassword" :type="showConfirm ? 'text' : 'password'"
              placeholder="Re-enter password" maxlength="50"
              autocomplete="new-password" :disabled="loading" />
            <button type="button" class="show-pwd" @click="showConfirm = !showConfirm">
              {{ showConfirm ? '🙈' : '👁️' }}
            </button>
          </div>
          <span v-if="fieldErrors.confirmPassword" class="err-msg">{{ fieldErrors.confirmPassword }}</span>
        </div>

        <div v-if="auth.signupError" class="error-msg">
          ⚠️ {{ auth.signupError }}
        </div>

        <button type="submit" class="signup-btn" :disabled="loading">
          <span v-if="loading" class="spinner">⚙️</span>
          <span v-else>✅ Create Account</span>
        </button>

        <div class="login-link">
          Already have an account?
          <router-link to="/login">Sign In →</router-link>
        </div>
      </form>

      <div class="signup-footer">© 2026 GEAMH — IT / HR Division</div>
    </div>
  </div>
</template>

<style scoped>
.signup-page {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  position: relative;
  background: linear-gradient(135deg, #0d3d20 0%, #1a6b3c 50%, #27ae60 100%);
  overflow: hidden; padding: 24px;
}
.signup-bg {
  position: absolute; inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}
.signup-card {
  background: #fff; border-radius: 16px; padding: 36px 32px;
  width: 480px; max-width: 100%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3); position: relative; z-index: 1;
}
.signup-header { text-align: center; margin-bottom: 24px; }
.hospital-icon { font-size: 44px; margin-bottom: 8px; }
.signup-logo {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  margin: 0 auto 10px;
}
.signup-header h1 { margin: 0 0 4px; font-size: 22px; font-weight: 800; color: #1a6b3c; }
.signup-header p { margin: 0 0 6px; font-size: 12px; color: #555; }
.system-label {
  display: inline-block; background: #e8f5ee; color: #1a6b3c;
  padding: 3px 12px; border-radius: 12px; font-size: 11px; font-weight: 600;
}
.success-box { text-align: center; padding: 40px 20px; }
.success-icon { font-size: 52px; margin-bottom: 12px; }
.success-box h3 { color: #1a6b3c; margin: 0 0 6px; font-size: 20px; }
.success-box p { color: #888; font-size: 13px; }
.signup-form { display: flex; flex-direction: column; gap: 14px; }
.two-col { display: flex; gap: 12px; }
.two-col .form-group { flex: 1; }
.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-group label { font-size: 11px; font-weight: 700; color: #444; text-transform: uppercase; letter-spacing: 0.4px; }
.input-wrapper {
  display: flex; align-items: center;
  border: 2px solid #e0e0e0; border-radius: 10px;
  overflow: hidden; transition: border-color 0.2s; background: #fafafa;
}
.input-wrapper:focus-within { border-color: #1a6b3c; background: #fff; }
.input-wrapper.has-error { border-color: #c0392b; }
.input-icon { padding: 0 10px; font-size: 15px; flex-shrink: 0; }
.input-wrapper input, .input-wrapper select {
  flex: 1; padding: 10px 8px; border: none; outline: none; font-size: 13px; background: transparent;
}
.input-wrapper input:disabled, .input-wrapper select:disabled { opacity: 0.6; }
.show-pwd { background: none; border: none; padding: 0 10px; cursor: pointer; font-size: 15px; }
.hint { font-size: 10px; color: #aaa; }
.err-msg { font-size: 11px; color: #c0392b; font-weight: 600; }
.req { color: #c0392b; }
.strength-bar { height: 4px; background: #eee; border-radius: 2px; margin-top: 4px; overflow: hidden; }
.strength-fill { height: 100%; border-radius: 2px; transition: all 0.3s; }
.strength-label { font-size: 10px; font-weight: 600; }
.error-msg {
  background: #fdecea; color: #c0392b; padding: 10px 14px;
  border-radius: 8px; font-size: 13px; border: 1px solid #f5b7b1;
}
.signup-btn {
  background: linear-gradient(135deg, #1a6b3c, #27ae60);
  color: #fff; border: none; padding: 13px; border-radius: 10px;
  font-size: 15px; font-weight: 700; cursor: pointer;
  transition: opacity 0.2s, transform 0.1s; margin-top: 4px;
}
.signup-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
.signup-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.spinner { display: inline-block; animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.login-link { text-align: center; font-size: 13px; color: #555; }
.login-link a { color: #1a6b3c; font-weight: 700; text-decoration: none; margin-left: 4px; }
.login-link a:hover { text-decoration: underline; }
.signup-footer { text-align: center; margin-top: 20px; font-size: 11px; color: #aaa; }
</style>
