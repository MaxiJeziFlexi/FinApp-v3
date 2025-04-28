const express = require('express');
const cors = require('cors');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const { MonthlyShipments, DailyShipment } = require('./utilities/Data');

const app = express();
const port = 4001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Helper function to safely retrieve cell values
const getValue = (cell) => cell?.value?.result || cell?.value || '';

// Endpoint: Fetch Credit Loans
app.get('/credit-loans', async (req, res) => {
  try {
    const filePath = path.join(__dirname, 'public', 'data', 'credit-loans.xlsx');

    // Sprawdzenie, czy plik istnieje
    if (!fs.existsSync(filePath)) {
      console.error('Excel file not found at:', filePath);
      return res.status(400).json({ error: 'Excel file not found. Please ensure the file exists and try again.' });
    }

    // Odczytanie pliku Excel
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1);

    const data = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Pomijanie nagłówków
        const rowData = {
          LoanID: row.getCell(1).value || '',
          AccountHolder: row.getCell(2).value || '',
          LoanType: row.getCell(3).value || '',
          Amount: parseFloat(row.getCell(4).value) || 0,
          Currency: row.getCell(5).value || '',
          InterestRate: parseFloat(row.getCell(6).value) || 0,
          DurationMonths: parseInt(row.getCell(7).value, 10) || 0,
          MonthlyPayment: parseFloat(row.getCell(8).value) || 0,
          Status: row.getCell(9).value || '',
        };
        data.push(rowData);
      }
    });

    console.log('Fetched Credit Loans:', data); // Debug
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching credit loans:', error.message);
    res.status(500).json({ error: 'Unable to fetch credit loans. Please try again later.' });
  }
});


// Endpoint: Add New Credit Loan
app.post('/credit-loans', async (req, res) => {
  try {
    const newLoan = req.body;

    // Debug log for incoming data
    console.log('Received new loan data:', newLoan);

    // File path to the Excel file
    const filePath = path.join(__dirname, 'public', 'data', 'credit-loans.xlsx');

    // Ensure the file exists
    if (!fs.existsSync(filePath)) {
      console.error('Excel file not found at:', filePath);
      return res.status(400).json({ error: 'Excel file not found. Please ensure the file exists and try again.' });
    }

    // Load the Excel file
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1);
    console.log(req.body)
    // Validate input data
    if (
      !newLoan.AccountHolder ||
      !newLoan.LoanType ||
      isNaN(newLoan.Amount) ||
      isNaN(newLoan.InterestRate) ||
      isNaN(newLoan.DurationMonths) ||
      !newLoan.Currency
    ) {
      console.error('Invalid loan data provided:', newLoan);
      return res.status(400).json({ error: 'Invalid loan data. Please check all required fields and try again.' });
    }

    // Calculate Loan ID
    const lastRow = worksheet.lastRow;
    const lastLoanID = parseInt(lastRow && lastRow.getCell(1).value || 0, 10);
    const newLoanID = lastLoanID + 1;

    // Calculate Monthly Payment
    const principal = parseFloat(newLoan.Amount);
    const interestRate = parseFloat(newLoan.InterestRate) / 100 / 12; // Convert to monthly rate
    const months = parseInt(newLoan.DurationMonths, 10);
    const monthlyPayment =
      interestRate > 0
        ? (principal * interestRate) / (1 - Math.pow(1 + interestRate, -months))
        : principal / months;

    console.log('Calculated Monthly Payment:', monthlyPayment);

    // Add the new loan to the worksheet
    const newRow = worksheet.addRow([
      newLoanID, // Auto-generated Loan ID
      newLoan.AccountHolder,
      newLoan.LoanType,
      principal.toFixed(2), // Format the principal to 2 decimal places
      newLoan.Currency,
      newLoan.InterestRate,
      months,
      monthlyPayment.toFixed(2), // Format the payment to 2 decimal places
      newLoan.Status,
    ]);
    newRow.commit();

    // Save changes back to the Excel file
    await workbook.xlsx.writeFile(filePath);

    console.log('New loan added successfully:', { LoanID: newLoanID });
    res.status(201).json({ message: 'Loan added successfully!', LoanID: newLoanID });
  } catch (error) {
    console.error('Error adding new loan:', error.message);
    res.status(500).json({ error: 'Unable to add new loan. Please try again later.' });
  }
});
// Endpoint: Fetch Investments
app.get('/investments', async (req, res) => {
  try {
    const filePath = path.join(__dirname, 'public', 'data', 'investments.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.getWorksheet(1);
    const data = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Pomijamy wiersz nagłówka
        const rowData = {
          InvestmentID: row.getCell(1).value,
          InvestorName: row.getCell(2).value,
          InvestmentType: row.getCell(3).value,
          AmountInvested: parseFloat(row.getCell(4).value || 0),
          CurrentValue: parseFloat(row.getCell(5).value || 0),
          Currency: row.getCell(6).value,
          ReturnRate: parseFloat(row.getCell(7).value || 0),
          StartDate: row.getCell(8).value,
          MaturityDate: row.getCell(9).value,
          Status: row.getCell(10).value,
          Broker: row.getCell(11).value,
          Portfolio: row.getCell(12).value,
        };
        data.push(rowData);
      }
    });

    res.json(data);
  } catch (error) {
    console.error('Error fetching investments:', error.message);
    res.status(500).json({ error: 'Unable to fetch investments data. Please try again later.' });
  }
});


// Endpoint: Add New Investment
app.post('/investments', async (req, res) => {
  try {
    const newInvestment = req.body;
    console.log('Received new investment data:', newInvestment);

    const filePath = path.join(__dirname, 'public', 'data', 'investments.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.getWorksheet(1);

    // Calculate Investment ID
    const lastRow = worksheet.lastRow;
    const lastInvestmentID = parseInt(lastRow && lastRow.getCell(1).value || 0, 10);
    const newInvestmentID = lastInvestmentID + 1;

    // Add new row with the correct column order
    const newRow = worksheet.addRow([
      newInvestmentID, // Investment ID
      newInvestment.InvestorName,
      newInvestment.InvestmentType,
      newInvestment.AmountInvested,
      newInvestment.CurrentValue,
      newInvestment.Currency,
      newInvestment.ReturnRate,
      newInvestment.StartDate,
      newInvestment.MaturityDate,
      newInvestment.Status,
      newInvestment.Broker,
      newInvestment.Portfolio,
    ]);
    newRow.commit();

    // Save the updated Excel file
    await workbook.xlsx.writeFile(filePath);

    console.log('New investment added successfully:', { InvestmentID: newInvestmentID });
    res.status(201).json({ message: 'Investment added successfully!', InvestmentID: newInvestmentID });
  } catch (error) {
    console.error('Error adding new investment:', error.message);
    res.status(500).json({ error: 'Unable to add new investment. Please try again later.' });
  }
});


// Endpoint: Fetch Transactions
app.get('/transactions', async (req, res) => {
  try {
    const filePath = path.join(__dirname, 'public', 'data', 'transactions.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.getWorksheet(1);
    const data = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        const rowData = {
          TransactionID: getValue(row.getCell(1)),
          Date: getValue(row.getCell(2)),
          Time: getValue(row.getCell(3)),
          Category: getValue(row.getCell(4)),
          Type: getValue(row.getCell(5)),
          Amount: getValue(row.getCell(6)),
          Currency: getValue(row.getCell(7)),
          Account: getValue(row.getCell(8)),
          Description: getValue(row.getCell(9)),
        };
        data.push(rowData);
      }
    });

    res.json(data);
  } catch (error) {
    console.error('Error reading transactions.xlsx:', error.message);
    res.status(500).json({ error: 'Unable to fetch transactions data. Please try again later.' });
  }
});

// Endpoint: Fetch Account Balances
app.get('/account-balances', async (req, res) => {
  try {
    const filePath = path.join(__dirname, 'data', 'account-balances.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.getWorksheet(1);
    const data = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Pomijamy wiersz nagłówka
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          rowData[`Column${colNumber}`] = cell.value || '';
        });
        data.push(rowData);
      }
    });

    res.status(200).json(data);
  } catch (error) {
    console.error('Error reading Excel file:', error.message);
    res.status(500).json({ error: 'Unable to load account balances. Please check the file and try again.' });
  }
});

// Authentication Endpoints
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const filePath = path.join(__dirname, 'public', 'data', 'users.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.getWorksheet(1);
    let isAuthenticated = false;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        const fileUsername = getValue(row.getCell(2));
        const filePassword = getValue(row.getCell(3));

        if (username === fileUsername && bcrypt.compareSync(password, filePassword)) {
          isAuthenticated = true;
        }
      }
    });

    if (isAuthenticated) {
      res.json({ success: true, message: 'Login successful. Welcome back!' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid username or password. Please try again.' });
    }
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error. Please try again later.' });
  }
});

app.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);

    const filePath = path.join(__dirname, 'public', 'data', 'users.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.getWorksheet(1);
    const newRow = worksheet.addRow([null, username, hashedPassword, email]);
    newRow.commit();

    await workbook.xlsx.writeFile(filePath);
    res.json({ success: true, message: 'User registered successfully! Welcome aboard!' });
  } catch (error) {
    console.error('Error during registration:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error. Please try again later.' });
  }
});
app.get('/profile', async (req, res) => {
  try {
    const filePath = path.join(__dirname, 'public', 'data', 'users.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.getWorksheet(1);
    const users = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Skip header row
        const user = {
          ID: row.getCell(1).value,
          Username: row.getCell(2).value,
          FirstName: row.getCell(3).value,
          LastName: row.getCell(4).value,
          PhoneNumber: row.getCell(5).value,
          Address: row.getCell(6).value,
          Preferences: row.getCell(7).value,
          img: row.getCell(8).value || '', // Optional field for image
        };
        users.push(user);
      }
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching profile data:', error.message);
    res.status(500).json({ error: 'Unable to fetch profile data. Please try again later.' });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
