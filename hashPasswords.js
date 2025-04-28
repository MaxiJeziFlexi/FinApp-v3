const ExcelJS = require('exceljs');
const bcrypt = require('bcrypt');
const path = require('path');

const hashPasswords = async () => {
  try {
    const filePath = path.join(__dirname, 'public', 'data', 'users.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.getWorksheet(1);

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        const plainPassword = row.getCell(3).value;
        if (plainPassword && !plainPassword.startsWith('$2b$')) {
          row.getCell(3).value = bcrypt.hashSync(plainPassword, 10);
        }
      }
    });

    await workbook.xlsx.writeFile(filePath);
    console.log('Passwords hashed successfully.');
  } catch (error) {
    console.error('Error hashing passwords:', error.message);
  }
};

hashPasswords();
