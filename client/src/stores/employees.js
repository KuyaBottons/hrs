import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useEmployeeStore = defineStore('employees', () => {
  const employees = ref([])

  // Departments loaded from DB via fetchDepartments() below

  const positions = [
    'Medical Officer I', 'Medical Officer II', 'Medical Officer III', 'Medical Officer IV',
    'Nurse I', 'Nurse II', 'Nurse III', 'Nurse IV',
    'Medical Technologist I', 'Medical Technologist II',
    'Radiologic Technologist I', 'Radiologic Technologist II',
    'Pharmacist I', 'Pharmacist II',
    'Administrative Aide IV', 'Administrative Aide VI',
    'Administrative Officer I', 'Administrative Officer II',
    'Accountant I', 'Accountant II',
    'Utility Worker I', 'Security Guard I',
  ]

  const employmentStatuses = ['Permanent', 'Casual', 'Contractual', 'Job Order', 'Co-terminus', 'Part Time']

  const API = 'http://localhost/hrs/server/api/employees.php'
  const DEPT_API = 'http://localhost/hrs/server/api/departments.php'
  const loading = ref(false)
  const error = ref(null)

  // Departments — loaded from DB, fallback to empty until API responds
  const departments = ref([])

  async function fetchDepartments() {
    try {
      const res = await fetch(DEPT_API)
      if (!res.ok) throw new Error('Failed to fetch departments')
      const rows = await res.json()
      if (Array.isArray(rows) && rows.length > 0) {
        departments.value = rows.map(r => r.name)
      }
    } catch (e) {
      console.error('Departments API error:', e.message)
    }
  }

  // Load all employees from DB � replaces in-memory list
  async function fetchEmployees() {
    try {
      loading.value = true
      const res = await fetch(API)
      if (!res.ok) throw new Error('Failed to fetch')
      const rows = await res.json()
      if (Array.isArray(rows) && rows.length > 0) {
        // Map snake_case DB columns back to camelCase for the frontend
        employees.value = rows.map(r => ({
          id:               r.id,
          employeeNo:       r.employee_no,
          lastName:         r.last_name,
          firstName:        r.first_name,
          middleName:       r.middle_name       ?? '',
          position:         r.position          ?? '',
          designation:      r.designation       ?? '',
          department:       r.department        ?? '',
          employmentStatus: r.employment_status ?? 'Casual',
          dateHired:        r.date_hired        ?? '',
          birthDate:        r.birth_date        ?? '',
          age:              r.age               ?? 0,
          gender:           r.gender            ?? '',
          civilStatus:      r.civil_status      ?? '',
          address:          r.address           ?? '',
          contactNo:        r.contact_no        ?? '',
          email:            r.email             ?? '',
          salary:           Number(r.salary)    || 0,
          sgStep:           r.sg_step           ?? '',
          tin:              r.tin_number        ?? '',
          sss:              r.sss_gsis_number   ?? '',
          philhealth:       r.phil_number       ?? '',
          pagibig:          r.pi_number         ?? '',
          active:           r.active == 1,
        }))
      }
    } catch (e) {
      error.value = e.message
      console.warn('employees API unavailable, using local data:', e.message)
    } finally {
      loading.value = false
    }
  }

  // Call on store init
  fetchEmployees()
  fetchDepartments()

  async function addEmployee(emp) {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emp),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Insert failed')
    // Refresh from DB so the list is always in sync
    await fetchEmployees()
  }

  async function updateEmployee(id, data) {
    const res = await fetch(`${API}?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Update failed')
    // Refresh from DB so the list reflects the actual saved state
    await fetchEmployees()
  }

  async function deleteEmployee(id) {
    try {
      const res = await fetch(`${API}?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Delete failed')
    } catch (e) {
      console.error('deleteEmployee error:', e.message)
    }
    // Always remove from local state
    employees.value = employees.value.filter(e => e.id !== id)
  }

  function getById(id) {
    return employees.value.find(e => e.id === Number(id))
  }

  const currentMonth = new Date().getMonth() + 1

  const birthdayCelebrantsThisMonth = computed(() =>
    employees.value.filter(e => {
      const month = new Date(e.birthDate).getMonth() + 1
      return month === currentMonth && e.active
    })
  )

  const turning65ThisYear = computed(() => {
    const year = new Date().getFullYear()
    return employees.value.filter(e => {
      const birthYear = new Date(e.birthDate).getFullYear()
      return year - birthYear === 65 && e.active
    })
  })

  return {
    employees,
    departments,
    positions,
    employmentStatuses,
    loading,
    error,
    fetchEmployees,
    fetchDepartments,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getById,
    birthdayCelebrantsThisMonth,
    turning65ThisYear,
  }
})




