import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const base = process.env.API_BASE_URL || 'http://localhost:8080/api';
const statePath = join(tmpdir(), 'vsc-api-test-state.json');
const mode = process.argv[2] || 'full';
const suffix = Date.now().toString().slice(-6);
const today = new Date().toISOString().slice(0, 10);
const shift = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const lines = [];
let failures = 0;

async function call(method, path, body) {
  const response = await fetch(base + path, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: response.status, data, text };
}

function record(id, action, expected, actual, pass) {
  lines.push(`${pass ? 'PASS' : 'FAIL'} ${id} ${action} | expected=${expected} | actual=${actual}`);
  if (!pass) failures += 1;
}

function rejected(response) {
  return response.status >= 400 && response.status < 500;
}

function finish() {
  console.log(`API test base: ${base}`);
  console.log(`Run date: ${new Date().toISOString()}`);
  for (const line of lines) console.log(line);
  console.log(`SUMMARY ${lines.length - failures}/${lines.length} checks passed`);
  if (failures > 0) process.exitCode = 1;
}

if (mode === 'verify') {
  const state = JSON.parse(readFileSync(statePath, 'utf8'));
  const report = await call('GET', '/reports/completed-job-cards');
  const summary = await call('GET', '/dashboard/summary');
  const found = report.data.find((card) => card.id === state.jobId);
  const notesPreserved = found && found.completionNotes === 'Phase 7 completion notes.';
  const timestampPresent = Boolean(found && found.completedAt);
  record('T13', 'Persistence after backend restart',
    'completed job present with notes and completedAt after restart',
    `report=${report.status}; found=${Boolean(found)}; notes=${Boolean(notesPreserved)}; completedAt=${Boolean(timestampPresent)}; customers=${summary.data.customers}; vehicles=${summary.data.vehicles}; bookings=${summary.data.bookings}; jobCards=${summary.data.jobCards}`,
    report.status === 200 && Boolean(found) && Boolean(notesPreserved) && Boolean(timestampPresent));
  finish();
  process.exit(process.exitCode || 0);
}

if (mode !== 'full') {
  console.error('Usage: node scripts/api-tests.mjs [full|verify]');
  process.exit(2);
}

const customerBody = (code, phone, address) => ({
  customerCode: code,
  fullName: 'API Test Customer',
  phone,
  email: `api${suffix}@test.local`,
  address
});

const customerCreated = await call('POST', '/customers', customerBody(`C-API-${suffix}`, '1234567890', '1 Test Road'));
const customer = customerCreated.data;
const customerRead = await call('GET', `/customers/${customer.id}`);
const customerUpdated = await call('PUT', `/customers/${customer.id}`, customerBody(customer.customerCode, customer.phone, '2 Updated Road'));
const customerReread = await call('GET', `/customers/${customer.id}`);
record('T01', 'Customer create/view/update/read',
  '201/200/200/200 and updated address retained',
  `${customerCreated.status}/${customerRead.status}/${customerUpdated.status}/${customerReread.status}; address=${customerReread.data.address}`,
  customerCreated.status === 201 && customerRead.status === 200 && customerUpdated.status === 200 && customerReread.status === 200 && customerReread.data.address === '2 Updated Road');

const vehicleBody = (registrationNumber, odometerReading = 12000) => ({
  registrationNumber,
  make: 'Toyota',
  model: 'Hilux',
  year: 2020,
  fuelType: 'DIESEL',
  customerId: customer.id,
  odometerReading
});
const registration = `API-${suffix}`;
const vehicleCreated = await call('POST', '/vehicles', vehicleBody(registration));
const vehicleRead = await call('GET', `/vehicles/${vehicleCreated.data.id}`);
const vehicleUpdated = await call('PUT', `/vehicles/${vehicleCreated.data.id}`, vehicleBody(registration, 12500));
const vehicleReread = await call('GET', `/vehicles/${vehicleCreated.data.id}`);
record('T02', 'Vehicle add/update with customer relationship',
  '201/200/200/200 and odometer retained',
  `${vehicleCreated.status}/${vehicleRead.status}/${vehicleUpdated.status}/${vehicleReread.status}; customerId=${vehicleReread.data.customerId}; odometer=${vehicleReread.data.odometerReading}`,
  vehicleCreated.status === 201 && vehicleRead.status === 200 && vehicleUpdated.status === 200 && vehicleReread.status === 200 && vehicleReread.data.customerId === customer.id && vehicleReread.data.odometerReading === 12500);

const duplicateVehicle = await call('POST', '/vehicles', vehicleBody(registration));
record('T03', 'Duplicate registration rejected',
  '409 with registration message',
  `status=${duplicateVehicle.status}; message=${duplicateVehicle.data.message ?? ''}`,
  duplicateVehicle.status === 409 && String(duplicateVehicle.data.message).toLowerCase().includes('registration'));

const invalidFk = await call('POST', '/vehicles', { ...vehicleBody(`APIX-${suffix}`), customerId: 999999999 });
record('T04', 'Invalid foreign key rejected',
  '404 with customer message',
  `status=${invalidFk.status}; message=${invalidFk.data.message ?? ''}`,
  invalidFk.status === 404 && String(invalidFk.data.message).toLowerCase().includes('customer'));

const bookingBody = (vehicleId, number, bookingDate = today, preferredDate = shift(7)) => ({
  bookingNumber: number,
  vehicleId,
  bookingDate,
  preferredDate,
  complaint: `API test booking ${number}`,
  bookingStatus: 'CONFIRMED'
});
const bookingCreated = await call('POST', '/service-bookings', bookingBody(vehicleCreated.data.id, `BK-API-${suffix}`));
const bookingRead = await call('GET', `/service-bookings/${bookingCreated.data.id}`);
record('T05', 'Booking create and read',
  '201/200 with correct vehicle',
  `${bookingCreated.status}/${bookingRead.status}; registration=${bookingRead.data.registrationNumber}`,
  bookingCreated.status === 201 && bookingRead.status === 200 && bookingRead.data.registrationNumber === registration);

const availableTechCreated = await call('POST', '/technicians', {
  technicianCode: `T-APIA-${suffix}`,
  fullName: 'Available Tech',
  skillArea: 'General',
  phone: '1234567891',
  availabilityStatus: 'AVAILABLE'
});
const unavailableTechCreated = await call('POST', '/technicians', {
  technicianCode: `T-APIU-${suffix}`,
  fullName: 'Unavailable Tech',
  skillArea: 'General',
  phone: '1234567892',
  availabilityStatus: 'UNAVAILABLE'
});
const availableTech = availableTechCreated.data;
const unavailableTech = unavailableTechCreated.data;

const task = (hours = 1.5) => ({
  taskName: 'Oil change',
  description: 'Replace engine oil and filter',
  estimatedHours: hours,
  hourlyRate: 40,
  amount: 0
});
const jobCreate = (bookingId, technicianId, promisedDate = shift(7), openedDate = today) => ({
  bookingId,
  technicianId,
  openedDate,
  promisedDate,
  serviceTasks: [task()]
});

const jobCreated = await call('POST', '/job-cards', jobCreate(bookingCreated.data.id, availableTech.id));
const duplicateJob = await call('POST', '/job-cards', jobCreate(bookingCreated.data.id, availableTech.id));
record('T06', 'One job card per booking',
  'first 201, second 409 because booking is no longer CONFIRMED or job card exists',
  `first=${jobCreated.status}; second=${duplicateJob.status}; message=${duplicateJob.data.message ?? ''}`,
  jobCreated.status === 201 && duplicateJob.status === 409 && /confirmed|already has a job card/i.test(String(duplicateJob.data.message)));

const altVehicle = (await call('POST', '/vehicles', vehicleBody(`APIB-${suffix}`))).data;
const altBooking = (await call('POST', '/service-bookings', bookingBody(altVehicle.id, `BK-APIB-${suffix}`))).data;
const unavailableAssignment = await call('POST', '/job-cards', jobCreate(altBooking.id, unavailableTech.id));
record('T07', 'Technician availability enforced',
  'available 201, unavailable 409',
  `available=${jobCreated.status}; unavailable=${unavailableAssignment.status}; message=${unavailableAssignment.data.message ?? ''}`,
  jobCreated.status === 201 && unavailableAssignment.status === 409 && String(unavailableAssignment.data.message).toLowerCase().includes('unavailable'));

const job = jobCreated.data;
const negativeTask = await call('PUT', `/job-cards/${job.id}`, {
  technicianId: availableTech.id,
  openedDate: today,
  promisedDate: shift(7),
  jobStatus: 'OPEN',
  completionNotes: null,
  serviceTasks: [task(-1)]
});
record('T08', 'Backend estimate and negative rejection',
  'estimate 60.00; negative hours 400',
  `estimate=${job.labourEstimate}; negative=${negativeTask.status}`,
  Number(job.labourEstimate) === 60 && negativeTask.status === 400);

const validUpdate = (status, notes = null) => ({
  technicianId: availableTech.id,
  openedDate: today,
  promisedDate: shift(7),
  jobStatus: status,
  completionNotes: notes,
  serviceTasks: [task()]
});
const start = await call('PUT', `/job-cards/${job.id}`, validUpdate('IN_PROGRESS'));
const invalidTransition = await call('PUT', `/job-cards/${job.id}`, validUpdate('DELIVERED'));
const hold = await call('PUT', `/job-cards/${job.id}`, validUpdate('ON_HOLD'));
const resume = await call('PUT', `/job-cards/${job.id}`, validUpdate('IN_PROGRESS'));
record('T09', 'Status transitions controlled',
  'allowed 200; invalid 409',
  `start=${start.status}; invalid=${invalidTransition.status}; hold=${hold.status}; resume=${resume.status}`,
  start.status === 200 && invalidTransition.status === 409 && hold.status === 200 && resume.status === 200);

const noNotes = await call('PUT', `/job-cards/${job.id}`, validUpdate('COMPLETED'));
const withNotes = await call('PUT', `/job-cards/${job.id}`, validUpdate('COMPLETED', 'Phase 7 completion notes.'));
const delivered = await call('PUT', `/job-cards/${job.id}`, validUpdate('DELIVERED'));
record('T10', 'Completion notes and delivery timestamp',
  'no notes 409; with notes 200; delivery 200',
  `noNotes=${noNotes.status}; withNotes=${withNotes.status}; delivered=${delivered.status}; completedAt=${Boolean(withNotes.data.completedAt)}; deliveredAt=${Boolean(delivered.data.deliveredAt)}`,
  noNotes.status === 409 && withNotes.status === 200 && delivered.status === 200 && Boolean(withNotes.data.completedAt) && Boolean(delivered.data.deliveredAt));

const protectedDelete = await call('DELETE', `/job-cards/${job.id}`);
record('T11', 'Completed/delivered job deletion blocked',
  '409 conflict',
  `status=${protectedDelete.status}; message=${protectedDelete.data.message ?? ''}`,
  protectedDelete.status === 409);

const beforeCounts = {
  customers: (await call('GET', '/customers')).data.length,
  vehicles: (await call('GET', '/vehicles')).data.length,
  technicians: (await call('GET', '/technicians')).data.length
};
const deleteCustomer = await call('DELETE', `/customers/${customer.id}`);
const deleteVehicle = await call('DELETE', `/vehicles/${vehicleCreated.data.id}`);
const deleteTechnician = await call('DELETE', `/technicians/${availableTech.id}`);
const afterCounts = {
  customers: (await call('GET', '/customers')).data.length,
  vehicles: (await call('GET', '/vehicles')).data.length,
  technicians: (await call('GET', '/technicians')).data.length
};
record('T12', 'Dependency deletion blocked and rows retained',
  'three 409 responses and unchanged counts',
  `statuses=${deleteCustomer.status}/${deleteVehicle.status}/${deleteTechnician.status}; before=${JSON.stringify(beforeCounts)}; after=${JSON.stringify(afterCounts)}`,
  deleteCustomer.status === 409 && deleteVehicle.status === 409 && deleteTechnician.status === 409 && JSON.stringify(beforeCounts) === JSON.stringify(afterCounts));

const summary = await call('GET', '/dashboard/summary');
const statusCounts = await call('GET', '/dashboard/job-status-counts');
const delayed = await call('GET', '/dashboard/delayed-jobs');
const upcoming = await call('GET', '/dashboard/upcoming-jobs');
const report = await call('GET', '/reports/completed-job-cards');
record('T14', 'Dashboard and completed report',
  'all dashboard/report endpoints 200 with live data',
  `summary=${summary.status}; counts=${statusCounts.status}; delayed=${delayed.status}; upcoming=${upcoming.status}; report=${report.status}; reportContainsJob=${report.data.some((card) => card.id === job.id)}`,
  summary.status === 200 && statusCounts.status === 200 && delayed.status === 200 && upcoming.status === 200 && report.status === 200 && report.data.some((card) => card.id === job.id));

const shortPhone = await call('POST', '/customers', customerBody(`C-SHORT-${suffix}`, '123456789', '3 Test Road'));
const longPhone = await call('POST', '/customers', customerBody(`C-LONG-${suffix}`, '12345678901', '4 Test Road'));
const validPhoneCreated = await call('POST', '/customers', customerBody(`C-VALID-${suffix}`, '1234567893', '5 Test Road'));
const validPhoneDelete = validPhoneCreated.data.id ? await call('DELETE', `/customers/${validPhoneCreated.data.id}`) : { status: 0 };
record('T15', 'Phone validation',
  '9 and 11 digits 400; 10 digits 201',
  `short=${shortPhone.status}; long=${longPhone.status}; valid=${validPhoneCreated.status}; cleanup=${validPhoneDelete.status}`,
  shortPhone.status === 400 && longPhone.status === 400 && validPhoneCreated.status === 201 && validPhoneDelete.status === 204);

const nonDigitPhone = await call('POST', '/customers', customerBody(`C-ND-${suffix}`, '12345abcd', '6 Test Road'));
record('T17', 'Phone must contain only digits',
  '400 with phone message',
  `status=${nonDigitPhone.status}; message=${nonDigitPhone.data.message ?? ''}`,
  nonDigitPhone.status === 400 && /validation|digit/i.test(String(nonDigitPhone.data.message)));

const cancelBookingBody = bookingBody(vehicleCreated.data.id, `BK-CANCEL-${suffix}`);
const cancelBookingCreated = await call('POST', '/service-bookings', cancelBookingBody);
const cancelled = await call('PUT', `/service-bookings/${cancelBookingCreated.data.id}`,
  { ...cancelBookingBody, bookingStatus: 'CANCELLED' });
const cancelReverted = await call('PUT', `/service-bookings/${cancelBookingCreated.data.id}`,
  { ...cancelBookingBody, bookingStatus: 'CONFIRMED' });
record('T18', 'Cancelled booking cannot be reactivated',
  'cancel 200, revert 409',
  `cancel=${cancelled.status}; revert=${cancelReverted.status}; message=${cancelReverted.data.message ?? ''}`,
  cancelled.status === 200 && cancelReverted.status === 409 && /cancel/i.test(String(cancelReverted.data.message)));

const lockedJobCreated = await call('POST', '/job-cards', jobCreate(altBooking.id, availableTech.id));
const lockedStarted = await call('PUT', `/job-cards/${lockedJobCreated.data.id}`, validUpdate('IN_PROGRESS'));
const lockedCompleted = await call('PUT', `/job-cards/${lockedJobCreated.data.id}`,
  validUpdate('COMPLETED', 'Locked completion notes.'));
const lockedReopened = await call('PUT', `/job-cards/${lockedJobCreated.data.id}`,
  validUpdate('IN_PROGRESS', 'Changed notes.'));
const lockedNotesChanged = await call('PUT', `/job-cards/${lockedJobCreated.data.id}`,
  validUpdate('COMPLETED', 'Changed notes.'));
const lockedDelivered = await call('PUT', `/job-cards/${lockedJobCreated.data.id}`, validUpdate('DELIVERED'));
record('T19', 'Completed job locked except delivery',
  'start/complete 200; reopen and note edit 409; deliver 200',
  `start=${lockedStarted.status}; complete=${lockedCompleted.status}; reopen=${lockedReopened.status}; noteEdit=${lockedNotesChanged.status}; deliver=${lockedDelivered.status}`,
  lockedStarted.status === 200 && lockedCompleted.status === 200 && lockedReopened.status === 409 && lockedNotesChanged.status === 409 && lockedDelivered.status === 200);

const dateBooking = (await call('POST', '/service-bookings', bookingBody(vehicleCreated.data.id, `BK-DATE-${suffix}`))).data;
const badDate = await call('POST', '/job-cards', jobCreate(dateBooking.id, availableTech.id, shift(-1), today));
record('T20', 'Promised date cannot precede opened date',
  '409 with date message',
  `status=${badDate.status}; message=${badDate.data.message ?? ''}`,
  badDate.status === 409 && /date/i.test(String(badDate.data.message)));

writeFileSync(statePath, JSON.stringify({
  jobId: job.id,
  jobCardNumber: job.jobCardNumber,
  customerId: customer.id,
  vehicleId: vehicleCreated.data.id,
  technicianId: availableTech.id,
  completedAt: withNotes.data.completedAt,
  deliveredAt: delivered.data.deliveredAt
}, null, 2));

console.log('T16 UI workflow evidence: docs/evidence/03-create.png through 06-status.png');
console.log('T13 verification command: npm run test:api -- verify (restart backend first)');
finish();
