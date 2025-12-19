
/**
 * GOOGLE SHEETS DATABASE SCRIPT - GONZACARS C.A.
 * ID: 1L-Fmfey-8ZR6vgF5DVR6B5fiSLbVYo7YDs7pIuBxmEU
 */

const SPREADSHEET_ID = '1L-Fmfey-8ZR6vgF5DVR6B5fiSLbVYo7YDs7pIuBxmEU';

// Ejecutar esta función una vez para preparar el archivo
function setupDatabase() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheets = [
    { name: 'Customers', headers: ['id', 'name', 'phone', 'email', 'address', 'createdAt'] },
    { name: 'Inventory', headers: ['id', 'barcode', 'name', 'category', 'quantity', 'cost', 'price', 'lastEntry'] },
    { name: 'Repairs', headers: ['id', 'customerId', 'plate', 'brand', 'model', 'year', 'ownerName', 'responsible', 'status', 'diagnosis', 'serviceType', 'mechanicId', 'evidencePhotos', 'items', 'createdAt', 'finishedAt', 'paymentMethod'] },
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
  
  // Valor inicial de tasa si no existe
  const settings = ss.getSheetByName('Settings');
  settings.appendRow(['exchangeRate', '45.00']);
  
  return "Base de datos inicializada correctamente.";
}

function doGet(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const data = {};
  
  ss.getSheets().forEach(sheet => {
    const values = sheet.getDataRange().getValues();
    const headers = values.shift();
    data[sheet.getName()] = values.map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        let val = row[i];
        // Intentar parsear JSON para campos complejos (items, evidencePhotos)
        if ((h === 'items' || h === 'evidencePhotos') && typeof val === 'string' && val.startsWith('[')) {
          try { val = JSON.parse(val); } catch (e) {}
        }
        obj[h] = val;
      });
      return obj;
    });
  });
  
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const payload = JSON.parse(e.postData.contents);
  const sheet = ss.getSheetByName(payload.sheet);
  
  if (!sheet) return ContentService.createTextOutput("Sheet not found").setMimeType(ContentService.MimeType.TEXT);

  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const action = payload.action; // 'add' | 'update' | 'delete'
  
  if (action === 'add') {
    const newRow = headers.map(h => {
      let val = payload.data[h];
      return (typeof val === 'object') ? JSON.stringify(val) : val;
    });
    sheet.appendRow(newRow);
  } 
  else if (action === 'update') {
    const idIndex = headers.indexOf('id');
    const keyIndex = headers.indexOf('key'); // Para Settings
    const matchIndex = idIndex !== -1 ? idIndex : keyIndex;
    
    for (let i = 1; i < values.length; i++) {
      if (values[i][matchIndex] === (payload.data.id || payload.data.key)) {
        const updatedRow = headers.map(h => {
          let val = payload.data[h];
          return (typeof val === 'object') ? JSON.stringify(val) : val;
        });
        sheet.getRange(i + 1, 1, 1, headers.length).setValues([updatedRow]);
        break;
      }
    }
  }

  return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
}
