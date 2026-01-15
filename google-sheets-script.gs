
/**
 * GOOGLE SHEETS DATABASE SCRIPT - GONZACARS C.A.
 * ID: 1L-Fmfey-8ZR6vgF5DVR6B5fiSLbVYo7YDs7pIuBxmEU
 * RIF: J-50030426-9
 * 
 * UPDATE: Added LockService to prevent race conditions during concurrent writes.
 */

const SPREADSHEET_ID = '1L-Fmfey-8ZR6vgF5DVR6B5fiSLbVYo7YDs7pIuBxmEU';

function setupDatabase() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheets = [
    { name: 'Users', headers: ['id', 'username', 'password', 'name', 'role'] },
    { name: 'Customers', headers: ['id', 'name', 'phone', 'email', 'address', 'createdAt'] },
    { name: 'Inventory', headers: ['id', 'barcode', 'name', 'category', 'quantity', 'cost', 'price', 'lastEntry'] },
    { name: 'Repairs', headers: ['id', 'customerId', 'plate', 'brand', 'model', 'year', 'ownerName', 'responsible', 'status', 'diagnosis', 'serviceType', 'mechanicId', 'evidencePhotos', 'items', 'installments', 'createdAt', 'finishedAt', 'paymentMethod'] },
    { name: 'Sales', headers: ['id', 'customerId', 'date', 'customerName', 'items', 'total', 'iva', 'paymentMethod'] },
    { name: 'Purchases', headers: ['id', 'date', 'provider', 'invoiceNumber', 'productId', 'productName', 'category', 'price', 'quantity', 'total', 'type'] },
    { name: 'Expenses', headers: ['id', 'date', 'category', 'description', 'amount'] },
    { name: 'Employees', headers: ['id', 'name', 'role', 'baseSalary', 'commissionRate'] },
    { name: 'Settings', headers: ['key', 'value'] }
  ];

  sheets.forEach(s => {
    let sheet = ss.getSheetByName(s.name);
    if (!sheet) {
      sheet = ss.insertSheet(s.name);
    }
    sheet.clear();
    sheet.getRange(1, 1, 1, s.headers.length).setValues([s.headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  });
  
  const users = ss.getSheetByName('Users');
  users.appendRow(['u1', 'admin', 'admin', 'Admin Principal', 'administrador']);
  users.appendRow(['u2', 'vendedor', '1234', 'Vendedor Tienda', 'vendedor']);
  users.appendRow(['u3', 'cajero', '1234', 'Caja Taller', 'cajero']);

  const settings = ss.getSheetByName('Settings');
  settings.appendRow(['exchangeRate', '45.00']);
  
  return "Base de datos inicializada correctamente.";
}

function doGet(e) {
  const lock = LockService.getScriptLock();
  // Wait up to 10 seconds for other processes to finish
  try {
    lock.waitLock(10000);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({error: "Server busy"})).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const data = {};
    
    ss.getSheets().forEach(sheet => {
      const values = sheet.getDataRange().getValues();
      if (values.length > 1) { // Only process if there's data beyond header
        const headers = values.shift();
        data[sheet.getName()] = values.map(row => {
          const obj = {};
          headers.forEach((h, i) => {
            let val = row[i];
            if ((h === 'items' || h === 'evidencePhotos' || h === 'installments') && typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
              try { val = JSON.parse(val); } catch (e) {}
            }
            obj[h] = val;
          });
          return obj;
        });
      } else {
        data[sheet.getName()] = [];
      }
    });
    
    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  // Critical: Wait up to 30 seconds for the lock. 
  // This prevents race conditions where two requests write to the same row at the same time.
  try {
    lock.waitLock(30000); 
  } catch (e) {
    return ContentService.createTextOutput("Error: Server busy, lock timeout").setMimeType(ContentService.MimeType.TEXT);
  }

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const payload = JSON.parse(e.postData.contents);
    const sheet = ss.getSheetByName(payload.sheet);
    
    if (!sheet) return ContentService.createTextOutput("Error: Sheet not found").setMimeType(ContentService.MimeType.TEXT);

    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    const action = payload.action;
    
    if (action === 'add') {
      const newRow = headers.map(h => {
        let val = payload.data[h];
        return (typeof val === 'object') ? JSON.stringify(val) : val;
      });
      sheet.appendRow(newRow);
    } 
    else if (action === 'update') {
      const idIndex = headers.indexOf('id');
      const keyIndex = headers.indexOf('key');
      const matchIndex = idIndex !== -1 ? idIndex : keyIndex;
      
      // Reverse search is often faster for recent items, but standard loop is safer for consistency
      for (let i = 1; i < values.length; i++) {
        if (values[i][matchIndex] === (payload.data.id || payload.data.key)) {
          const updatedRow = headers.map(h => {
            let val = payload.data[h];
            return (typeof val === 'object') ? JSON.stringify(val) : val;
          });
          sheet.getRange(i + 1, 1, 1, headers.length).setValues([updatedRow]);
          break; // Stop after first match
        }
      }
    }
    else if (action === 'delete') {
      const idIndex = headers.indexOf('id');
      for (let i = 1; i < values.length; i++) {
        if (values[i][idIndex] === payload.data.id) {
          sheet.deleteRow(i + 1);
          break;
        }
      }
    }

    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  } catch (error) {
    return ContentService.createTextOutput("Error: " + error.toString()).setMimeType(ContentService.MimeType.TEXT);
  } finally {
    lock.releaseLock();
  }
}
