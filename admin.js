const adminKeyInput = document.getElementById('adminKey');
const saveKeyBtn = document.getElementById('saveKeyBtn');
const authStatus = document.getElementById('authStatus');
const statusFilter = document.getElementById('statusFilter');
const searchFilter = document.getElementById('searchFilter');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');
const exportBtn = document.getElementById('exportBtn');
const refreshBtn = document.getElementById('refreshBtn');
const tableStatus = document.getElementById('tableStatus');
const inquiryRows = document.getElementById('inquiryRows');
const directBookingForm = document.getElementById('directBookingForm');
const addBookingBtn = document.getElementById('addBookingBtn');
const bookingFormStatus = document.getElementById('bookingFormStatus');
const calendarRoom = document.getElementById('calendarRoom');
const calendarMonth = document.getElementById('calendarMonth');
const calendarCheckBtn = document.getElementById('calendarCheckBtn');
const calendarStatus = document.getElementById('calendarStatus');
const calendarGrid = document.getElementById('calendarGrid');
const calendarConflicts = document.getElementById('calendarConflicts');

const statTotal = document.getElementById('statTotal');
const statNew = document.getElementById('statNew');
const statContacted = document.getElementById('statContacted');
const statConfirmed = document.getElementById('statConfirmed');
const statClosed = document.getElementById('statClosed');

const statuses = ['new', 'contacted', 'confirmed', 'closed'];
const paymentStatuses = ['pending', 'partial', 'paid', 'refunded'];
let allInquiries = [];

function getAdminKey() {
  return localStorage.getItem('adminKey') || '';
}

function authHeaders() {
  const key = getAdminKey();
  const headers = { 'Content-Type': 'application/json' };
  if (key) {
    headers['x-admin-key'] = key;
  }
  return headers;
}

function setAuthMessage(message, isError = false) {
  authStatus.textContent = message;
  authStatus.style.color = isError ? '#a93734' : '#8d623f';
}

function setTableMessage(message, isError = false) {
  tableStatus.textContent = message;
  tableStatus.style.color = isError ? '#a93734' : '#8d623f';
}

function formatDate(value) {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatStay(checkIn, checkOut) {
  if (!checkIn && !checkOut) {
    return '-';
  }
  return `${checkIn || '-'} to ${checkOut || '-'}`;
}

function formatDateOnly(value) {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function toAmount(value) {
  return Number(value || 0).toLocaleString('en-PH');
}

function getStatusClass(status) {
  return `status-pill status-pill--${statuses.includes(status) ? status : 'new'}`;
}

function normalizeBooking(inquiry) {
  const booking = inquiry.booking || {};
  return {
    roomNumber: booking.roomNumber || '',
    guests: Number(booking.guests) > 0 ? Number(booking.guests) : 1,
    nights: Number(booking.nights) > 0 ? Number(booking.nights) : 1,
    ratePerNight: Number(booking.ratePerNight) || 0,
    totalAmount: Number(booking.totalAmount) || 0,
    amountPaid: Number(booking.amountPaid) || 0,
    paymentStatus: booking.paymentStatus || 'pending',
    notes: booking.notes || ''
  };
}

function renderRows(inquiries) {
  if (!inquiries.length) {
    inquiryRows.innerHTML = '<tr><td colspan="6">No inquiries found for this filter.</td></tr>';
    return;
  }

  inquiryRows.innerHTML = inquiries.map((inquiry) => {
    const guestName = `${inquiry.firstName} ${inquiry.lastName || ''}`.trim();
    const booking = normalizeBooking(inquiry);
    const rowStatus = statuses.includes(inquiry.status) ? inquiry.status : 'new';
    const statusOptions = statuses.map((status) => {
      const selected = inquiry.status === status ? 'selected' : '';
      return `<option value="${status}" ${selected}>${status}</option>`;
    }).join('');
    const paymentOptions = paymentStatuses.map((status) => {
      const selected = booking.paymentStatus === status ? 'selected' : '';
      return `<option value="${status}" ${selected}>${status}</option>`;
    }).join('');
    const balance = Math.max(0, booking.totalAmount - booking.amountPaid);

    return `
      <tr class="booking-row booking-row--${rowStatus}">
        <td>
          <strong>${escapeHtml(guestName)}</strong>
          <div class="guest-meta">${escapeHtml(inquiry.email || '-')}</div>
          <div class="guest-meta">${escapeHtml(inquiry.phone || '')}</div>
        </td>
        <td>${formatStay(inquiry.checkIn, inquiry.checkOut)}</td>
        <td class="booking-summary">
          Room: <strong>${escapeHtml(booking.roomNumber || '-')}</strong><br>
          Guests: <strong>${booking.guests}</strong> · Nights: <strong>${booking.nights}</strong><br>
          Total: <strong>PHP ${toAmount(booking.totalAmount)}</strong><br>
          Paid: <strong>PHP ${toAmount(booking.amountPaid)}</strong> · Balance: <strong>PHP ${toAmount(balance)}</strong>
        </td>
        <td><span class="${getStatusClass(inquiry.status)}">${inquiry.status || 'new'}</span></td>
        <td>${formatDate(inquiry.submittedAt)}</td>
        <td>
          <div class="action-group">
            <select data-action="status" data-id="${inquiry.id}">
              ${statusOptions}
            </select>
            <details class="more-details">
              <summary>Edit booking details</summary>
              <div class="details-grid payment-editor">
                <p class="detail-group">Room Assignment</p>
                <label class="field-label">Room Number
                  <input data-booking="roomNumber" data-id="${inquiry.id}" type="text" value="${escapeHtml(booking.roomNumber)}" placeholder="Room number" />
                </label>
                <label class="field-label">Guests
                  <input data-booking="guests" data-id="${inquiry.id}" type="number" min="1" step="1" value="${booking.guests}" />
                </label>

                <p class="detail-group">Payment</p>
                <label class="field-label">Payment Status
                  <select data-booking="paymentStatus" data-id="${inquiry.id}">${paymentOptions}</select>
                </label>
                <label class="field-label">Rate Per Night (PHP)
                  <input data-booking="ratePerNight" data-id="${inquiry.id}" type="number" min="0" step="100" value="${booking.ratePerNight}" />
                </label>
                <label class="field-label">Amount Paid (PHP)
                  <input data-booking="amountPaid" data-id="${inquiry.id}" type="number" min="0" step="100" value="${booking.amountPaid}" />
                </label>

                <p class="detail-group">Notes</p>
                <label class="field-label full-width">Booking Notes
                  <textarea data-booking="notes" data-id="${inquiry.id}" placeholder="Booking notes">${escapeHtml(booking.notes)}</textarea>
                </label>
                <label class="field-label full-width">Guest Message (Read-only)
                  <textarea readonly>${escapeHtml(inquiry.message || '')}</textarea>
                </label>
                <button class="small-btn" data-action="save-booking" data-id="${inquiry.id}" type="button">Save Booking</button>
              </div>
            </details>
            <button class="delete-btn" data-action="delete" data-id="${inquiry.id}" type="button">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function applyFilter() {
  const current = statusFilter.value;
  const keyword = searchFilter.value.trim().toLowerCase();

  const filteredByStatus = current === 'all'
    ? allInquiries
    : allInquiries.filter((item) => item.status === current);

  const filtered = !keyword
    ? filteredByStatus
    : filteredByStatus.filter((item) => {
        const booking = normalizeBooking(item);
        const haystack = [
          item.firstName,
          item.lastName,
          item.email,
          item.phone,
          item.roomType,
          item.message,
          booking.roomNumber,
          booking.notes
        ].join(' ').toLowerCase();
        return haystack.includes(keyword);
      });

  renderRows(filtered);
}

async function fetchStats() {
  const response = await fetch('/api/inquiries/stats', {
    headers: authHeaders()
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to load stats.');
  }

  const data = await response.json();
  const stats = data.stats || {};

  statTotal.textContent = String(stats.total || 0);
  statNew.textContent = String(stats.new || 0);
  statContacted.textContent = String(stats.contacted || 0);
  statConfirmed.textContent = String(stats.confirmed || 0);
  statClosed.textContent = String(stats.closed || 0);
}

async function fetchInquiries() {
  setTableMessage('Loading inquiries...');

  const response = await fetch('/api/inquiries', {
    headers: authHeaders()
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to load inquiries.');
  }

  const data = await response.json();
  allInquiries = Array.isArray(data.inquiries) ? data.inquiries : [];
  allInquiries.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  applyFilter();
  setTableMessage(`${allInquiries.length} inquiry record(s) loaded.`);
}

async function refreshDashboard() {
  refreshBtn.disabled = true;
  refreshBtn.textContent = 'Refreshing...';

  try {
    await Promise.all([fetchStats(), fetchInquiries()]);
    setAuthMessage('Connected to backend.');
  } catch (error) {
    setTableMessage(error.message, true);
    setAuthMessage(error.message, true);
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.textContent = 'Refresh';
  }
}

async function updateStatus(id, status) {
  const response = await fetch(`/api/inquiries/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ status })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update status.');
  }
}

async function deleteInquiry(id) {
  const response = await fetch(`/api/inquiries/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete inquiry.');
  }
}

async function saveBookingDetails(id, payload) {
  const response = await fetch(`/api/inquiries/${id}/booking`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to save booking details.');
  }
}

function csvValue(value) {
  const str = String(value || '');
  return `"${str.replaceAll('"', '""')}"`;
}

function exportToCsv() {
  if (!allInquiries.length) {
    setTableMessage('No records to export yet.', true);
    return;
  }

  const headers = [
    'id', 'firstName', 'lastName', 'email', 'checkIn', 'checkOut', 'roomType',
    'phone', 'status', 'submittedAt', 'guests', 'nights', 'roomNumber', 'ratePerNight',
    'totalAmount', 'amountPaid', 'paymentStatus', 'bookingNotes', 'message'
  ];

  const rows = allInquiries.map((item) => {
    const booking = normalizeBooking(item);
    return [
      item.id,
      item.firstName,
      item.lastName,
      item.email,
      item.phone || '',
      item.checkIn,
      item.checkOut,
      item.roomType,
      item.status,
      item.submittedAt,
      booking.guests,
      booking.nights,
      booking.roomNumber,
      booking.ratePerNight,
      booking.totalAmount,
      booking.amountPaid,
      booking.paymentStatus,
      booking.notes,
      item.message
    ].map(csvValue).join(',');
  });

  const csv = `${headers.join(',')}\n${rows.join('\n')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `antas-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  setTableMessage('CSV exported successfully.');
}

function setBookingFormMessage(message, isError = false) {
  bookingFormStatus.textContent = message;
  bookingFormStatus.style.color = isError ? '#a93734' : '#8d623f';
}

function setCalendarMessage(message, isError = false) {
  calendarStatus.textContent = message;
  calendarStatus.style.color = isError ? '#a93734' : '#8d623f';
}

function nightsRange(start, end) {
  const result = [];
  const cursor = new Date(start);
  const last = new Date(end);

  while (cursor < last) {
    result.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

function getMonthBounds(monthValue) {
  const [year, month] = monthValue.split('-').map(Number);
  const first = new Date(year, month - 1, 1);
  const nextMonth = new Date(year, month, 1);
  return {
    first,
    nextMonth,
    monthLabel: first.toLocaleString(undefined, { month: 'long', year: 'numeric' })
  };
}

function roomBookingsInMonth(roomNumber, monthValue) {
  const normalizedRoom = roomNumber.trim().toLowerCase();
  const { first, nextMonth } = getMonthBounds(monthValue);

  return allInquiries.filter((item) => {
    if (!['confirmed', 'contacted'].includes(item.status)) {
      return false;
    }

    const booking = normalizeBooking(item);
    if ((booking.roomNumber || '').trim().toLowerCase() !== normalizedRoom) {
      return false;
    }

    const start = new Date(item.checkIn);
    const end = new Date(item.checkOut);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
      return false;
    }

    return start < nextMonth && end > first;
  });
}

function renderCalendar(roomNumber, monthValue) {
  if (!roomNumber.trim() || !monthValue) {
    calendarGrid.innerHTML = '';
    calendarConflicts.innerHTML = '';
    return;
  }

  const bookings = roomBookingsInMonth(roomNumber, monthValue);
  const { first, monthLabel } = getMonthBounds(monthValue);
  const year = first.getFullYear();
  const month = first.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weekDayStart = first.getDay();

  const bookedMap = new Map();
  bookings.forEach((item) => {
    const guest = `${item.firstName} ${item.lastName || ''}`.trim();
    const dates = nightsRange(item.checkIn, item.checkOut);
    dates.forEach((dayKey) => {
      if (!bookedMap.has(dayKey)) {
        bookedMap.set(dayKey, []);
      }
      bookedMap.get(dayKey).push({ guest, status: item.status });
    });
  });

  const headers = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    .map((name) => `<th>${name}</th>`)
    .join('');

  let cells = '';
  for (let i = 0; i < weekDayStart; i += 1) {
    cells += '<td class="is-empty"></td>';
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dayKey = new Date(year, month, day).toISOString().slice(0, 10);
    const bookedEntries = bookedMap.get(dayKey) || [];

    if (bookedEntries.length) {
      cells += `
        <td class="is-booked">
          <div class="calendar-day-num">${day}</div>
          <span class="calendar-chip">Booked (${bookedEntries.length})</span>
        </td>
      `;
    } else {
      cells += `
        <td class="is-free">
          <div class="calendar-day-num">${day}</div>
          <span class="calendar-chip">Free</span>
        </td>
      `;
    }
  }

  while ((weekDayStart + daysInMonth + (cells.match(/<td/g) || []).length - (weekDayStart + daysInMonth)) % 7 !== 0) {
    break;
  }

  const totalCellCount = (cells.match(/<td/g) || []).length;
  const remainder = totalCellCount % 7;
  if (remainder !== 0) {
    for (let i = 0; i < 7 - remainder; i += 1) {
      cells += '<td class="is-empty"></td>';
    }
  }

  const rowMatches = cells.match(/<td[\s\S]*?<\/td>/g) || [];
  const rows = [];
  for (let i = 0; i < rowMatches.length; i += 7) {
    rows.push(`<tr>${rowMatches.slice(i, i + 7).join('')}</tr>`);
  }

  calendarGrid.innerHTML = `
    <table class="calendar">
      <caption>${monthLabel} · Room ${escapeHtml(roomNumber)}</caption>
      <thead><tr>${headers}</tr></thead>
      <tbody>${rows.join('')}</tbody>
    </table>
  `;

  if (!bookings.length) {
    calendarConflicts.innerHTML = '<p>No blocking bookings for this room in the selected month.</p>';
    return;
  }

  calendarConflicts.innerHTML = `
    <p><strong>Current room bookings:</strong></p>
    <ul>
      ${bookings.map((item) => `<li>${escapeHtml(`${item.firstName} ${item.lastName || ''}`.trim())} (${formatDateOnly(item.checkIn)} to ${formatDateOnly(item.checkOut)}) - ${escapeHtml(item.status)}</li>`).join('')}
    </ul>
  `;
}

async function checkAvailability(roomNumber, from, to, excludeId = '') {
  const params = new URLSearchParams({ roomNumber, from, to });
  if (excludeId) {
    params.set('excludeId', excludeId);
  }

  const response = await fetch(`/api/bookings/availability?${params.toString()}`, {
    headers: authHeaders()
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Failed to check room availability.');
  }
  return data;
}

async function createDirectBooking(event) {
  event.preventDefault();
  addBookingBtn.disabled = true;
  addBookingBtn.textContent = 'Adding...';

  const payload = {
    firstName: document.getElementById('bFirstName').value.trim(),
    lastName: document.getElementById('bLastName').value.trim(),
    email: document.getElementById('bEmail').value.trim(),
    phone: document.getElementById('bPhone').value.trim(),
    checkIn: document.getElementById('bCheckIn').value,
    checkOut: document.getElementById('bCheckOut').value,
    roomType: document.getElementById('bRoomType').value,
    booking: {
      roomNumber: document.getElementById('bRoomNumber').value.trim()
    },
    message: document.getElementById('bMessage').value.trim()
  };

  if (payload.checkIn && payload.checkOut && payload.booking.roomNumber) {
    try {
      const availability = await checkAvailability(
        payload.booking.roomNumber,
        payload.checkIn,
        payload.checkOut
      );
      if (!availability.available) {
        throw new Error('Selected room is already booked for those dates.');
      }
    } catch (error) {
      setBookingFormMessage(error.message, true);
      addBookingBtn.disabled = false;
      addBookingBtn.textContent = 'Add Booking';
      return;
    }
  }

  try {
    const response = await fetch('/api/inquiries/manual', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Unable to create booking.');
    }

    setBookingFormMessage(`Booking added. Reference: ${data.inquiryId.slice(0, 8)}`);
    directBookingForm.reset();
    await refreshDashboard();
  } catch (error) {
    setBookingFormMessage(error.message, true);
  } finally {
    addBookingBtn.disabled = false;
    addBookingBtn.textContent = 'Add Booking';
  }
}

saveKeyBtn.addEventListener('click', () => {
  const value = adminKeyInput.value.trim();
  localStorage.setItem('adminKey', value);
  setAuthMessage(value ? 'Admin key saved in this browser.' : 'Admin key cleared.');
  refreshDashboard();
});

statusFilter.addEventListener('change', applyFilter);
searchFilter.addEventListener('input', applyFilter);
clearFiltersBtn.addEventListener('click', () => {
  statusFilter.value = 'all';
  searchFilter.value = '';
  applyFilter();
});
exportBtn.addEventListener('click', exportToCsv);
refreshBtn.addEventListener('click', refreshDashboard);
directBookingForm.addEventListener('submit', createDirectBooking);

calendarCheckBtn.addEventListener('click', () => {
  const room = calendarRoom.value.trim();
  const month = calendarMonth.value;
  if (!room || !month) {
    setCalendarMessage('Please provide room number and month.', true);
    return;
  }

  renderCalendar(room, month);
  setCalendarMessage('Calendar loaded.');
});

inquiryRows.addEventListener('change', async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement) || target.dataset.action !== 'status') {
    return;
  }

  const id = target.dataset.id;
  const nextStatus = target.value;

  try {
    await updateStatus(id, nextStatus);
    setTableMessage(`Updated inquiry status to ${nextStatus}.`);
    await refreshDashboard();
  } catch (error) {
    setTableMessage(error.message, true);
  }
});

inquiryRows.addEventListener('click', async (event) => {
  const target = event.target;

  if (target instanceof HTMLButtonElement && target.dataset.action === 'save-booking') {
    const id = target.dataset.id;
    const payload = {
      paymentStatus: inquiryRows.querySelector(`[data-booking="paymentStatus"][data-id="${id}"]`)?.value,
      roomNumber: inquiryRows.querySelector(`[data-booking="roomNumber"][data-id="${id}"]`)?.value || '',
      guests: Number(inquiryRows.querySelector(`[data-booking="guests"][data-id="${id}"]`)?.value),
      ratePerNight: Number(inquiryRows.querySelector(`[data-booking="ratePerNight"][data-id="${id}"]`)?.value),
      amountPaid: Number(inquiryRows.querySelector(`[data-booking="amountPaid"][data-id="${id}"]`)?.value),
      notes: inquiryRows.querySelector(`[data-booking="notes"][data-id="${id}"]`)?.value || ''
    };

    try {
      const inquiry = allInquiries.find((item) => item.id === id);
      if (inquiry && payload.roomNumber && inquiry.checkIn && inquiry.checkOut) {
        const availability = await checkAvailability(payload.roomNumber, inquiry.checkIn, inquiry.checkOut, id);
        if (!availability.available) {
          throw new Error('Selected room has overlapping booking dates.');
        }
      }

      await saveBookingDetails(id, payload);
      setTableMessage('Booking details updated.');
      await refreshDashboard();
    } catch (error) {
      setTableMessage(error.message, true);
    }
    return;
  }

  if (!(target instanceof HTMLButtonElement) || target.dataset.action !== 'delete') {
    return;
  }

  const id = target.dataset.id;
  const confirmed = window.confirm('Delete this inquiry permanently?');
  if (!confirmed) {
    return;
  }

  try {
    await deleteInquiry(id);
    setTableMessage('Inquiry deleted.');
    await refreshDashboard();
  } catch (error) {
    setTableMessage(error.message, true);
  }
});

(function init() {
  adminKeyInput.value = getAdminKey();
  calendarMonth.value = new Date().toISOString().slice(0, 7);
  refreshDashboard();
})();
