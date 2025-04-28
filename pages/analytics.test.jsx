import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import Analytics from "../pages/analytics";
import axios from "axios";
import ExcelJS from "exceljs";
import { toast } from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";

// Mocks
jest.mock("axios");
jest.mock("exceljs", () => {
  return {
    Workbook: jest.fn().mockImplementation(() => {
      return {
        xlsx: { load: jest.fn().mockResolvedValue(undefined) },
        worksheets: [
          {
            // Dummy worksheet for account-balances, transactions, investments
            getRow: jest.fn((rowNum) => {
              return {
                eachCell: (options, cb) => {
                  if (rowNum === 1) {
                    cb({ value: "header" }, 1);
                  }
                },
              };
            }),
            eachRow: jest.fn((options, cb) => {
              if (options.includeEmpty === false) {
                // one dummy data row
                cb(
                  {
                    eachCell: (options2, cb2) => {
                      cb2({ value: "val" }, 1);
                    },
                  },
                  2
                );
              }
            }),
          },
        ],
      };
    }),
  };
});
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));
jest.mock("react-hot-toast", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));
jest.mock("uuid", () => ({
  v4: jest.fn(() => "unique-id"),
}));

describe("Analytics Component Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to setup axios.get for loadData in Analytics
  const setupAxiosGetMock = (customResponses = {}) => {
    // Files order: account-balances.xlsx, transactions.xlsx, investments.xlsx, credit-loans.xlsx
    axios.get.mockImplementation((url) => {
      if (url.includes("credit-loans.xlsx") && customResponses.creditLoans) {
        return Promise.resolve({ data: customResponses.creditLoans });
      }
      return Promise.resolve({ data: new ArrayBuffer(1) });
    });
  };

  test("testRenderFinancialOverview - Renders Financial Overview tab with interactive charts", async () => {
    setupAxiosGetMock();
    // Render the Analytics component
    await act(async () => {
      render(<Analytics />);
    });
    // Financial Overview is the default tab
    expect(screen.getByText("Financial Overview")).toBeInTheDocument();
    // Look for chart section headings
    expect(screen.getByText("Net Worth Trend")).toBeInTheDocument();
    expect(screen.getByText("Monthly Expenses")).toBeInTheDocument();
    expect(screen.getByText("Asset Allocation")).toBeInTheDocument();
  });

  test("testAddNewGoal - Processes a valid goal addition", async () => {
    setupAxiosGetMock();
    await act(async () => {
      render(<Analytics />);
    });

    // Switch to "goals" tab
    const goalsTabButton = screen.getByRole("button", { name: /goals/i });
    fireEvent.click(goalsTabButton);

    // Fill out the new goal inputs
    const goalNameInput = screen.getByPlaceholderText(/enter goal name/i);
    const targetAmountInput = screen.getByPlaceholderText(/enter target amount/i);
    const dateInput = screen.getByDisplayValue("");

    fireEvent.change(goalNameInput, { target: { value: "Test Goal" } });
    fireEvent.change(targetAmountInput, { target: { value: "1000" } });
    // Use a future date
    fireEvent.change(dateInput, { target: { value: "2100-01-01" } });

    const addGoalButton = screen.getByRole("button", { name: /add goal/i });
    fireEvent.click(addGoalButton);

    // Wait for UI update
    await waitFor(() => {
      expect(screen.getByText("Test Goal")).toBeInTheDocument();
    });
    // Also verify toast.success was called with the proper key
    expect(toast.success).toHaveBeenCalledWith("goalAddedSuccessfully");
  });

  test("testAIResponseSuccess - Executes a valid AI assistant prompt and returns a proper response in Polish", async () => {
    setupAxiosGetMock();
    // Mock axios.post for AI call
    const mockAIResponse = {
      data: {
        choices: [
          {
            message: { content: "Odpowiedź testowa w języku polskim" },
          },
        ],
      },
    };
    axios.post.mockResolvedValueOnce(mockAIResponse);

    await act(async () => {
      render(<Analytics />);
    });

    // Switch to AI tab
    const aiTabButton = screen.getByRole("button", { name: /ai/i });
    fireEvent.click(aiTabButton);

    const questionInput = screen.getByPlaceholderText(/ask a question about your finances/i);
    fireEvent.change(questionInput, { target: { value: "Test question" } });
    // Trigger AI request by simulating Enter key press
    fireEvent.keyPress(questionInput, { key: "Enter", code: "Enter", charCode: 13 });
    // Wait for the AI response to appear
    await waitFor(() => {
      expect(screen.getByText(/Odpowiedź testowa w języku polskim/)).toBeInTheDocument();
    });
  });

  test("testDebtOptimizerMissingLoanValues - Handles missing or undefined loan properties without crashing", async () => {
    // For this test, override axios.get for credit-loans.xlsx to return a worksheet that produces an empty object.
    axios.get.mockImplementation((url) => {
      if (url.includes("credit-loans.xlsx")) {
        // Create a custom workbook simulation for credit loans that returns empty loan object
        const customWorkbook = {
          xlsx: { load: jest.fn().mockResolvedValue(undefined) },
          worksheets: [
            {
              getRow: jest.fn((rowNum) => {
                return {
                  eachCell: (opts, cb) => {
                    if (rowNum === 1) {
                      cb({ value: "Name" }, 1);
                    }
                  },
                };
              }),
              eachRow: jest.fn((opts, cb) => {
                if (opts.includeEmpty === false) {
                  // Return one row with no data (loan with missing properties)
                  cb(
                    {
                      eachCell: (opts, cb2) => {
                        // Do not call cb2 so headers remain undefined
                      },
                    },
                    2
                  );
                }
              }),
            },
          ],
        };
        // Mock ExcelJS.Workbook to return our custom workbook for this call
        ExcelJS.Workbook.mockImplementationOnce(() => customWorkbook);
        return Promise.resolve({ data: new ArrayBuffer(1) });
      }
      return Promise.resolve({ data: new ArrayBuffer(1) });
    });
    await act(async () => {
      render(<Analytics />);
    });
    // Switch to advice tab (DebtOptimizer is rendered in advice tab)
    const adviceTabButton = screen.getByRole("button", { name: /advice/i });
    fireEvent.click(adviceTabButton);

    // Since loan.Name is missing, it should display translation fallback key "unknownLoan"
    await waitFor(() => {
      expect(screen.getByText("unknownLoan")).toBeInTheDocument();
    });
  });

  test("testGoalTrackerPastDeadline - Displays appropriate deadline status for past goals", async () => {
    setupAxiosGetMock();
    await act(async () => {
      render(<Analytics />);
    });
    // Switch to goals tab
    const goalsTabButton = screen.getByRole("button", { name: /goals/i });
    fireEvent.click(goalsTabButton);

    // Fill out the goal inputs with a past date
    const goalNameInput = screen.getByPlaceholderText(/enter goal name/i);
    const targetAmountInput = screen.getByPlaceholderText(/enter target amount/i);
    const dateInput = screen.getByDisplayValue("");

    fireEvent.change(goalNameInput, { target: { value: "Past Goal" } });
    fireEvent.change(targetAmountInput, { target: { value: "500" } });
    // Use a past date (e.g. 2000-01-01)
    fireEvent.change(dateInput, { target: { value: "2000-01-01" } });

    const addGoalButton = screen.getByRole("button", { name: /add goal/i });
    fireEvent.click(addGoalButton);

    // Wait for UI update; the GoalTracker should now display "deadlinePassed"
    await waitFor(() => {
      expect(screen.getByText(/deadlinePassed/i)).toBeInTheDocument();
    });
  });

  test("testAICancellationOnRapidRequests - Cancels previous AI requests when multiple occur in quick succession", async () => {
    setupAxiosGetMock();
    // Create a mock for axios.post that delays resolution.
    let resolveFirst;
    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });
    // The first call will not resolve immediately.
    axios.post.mockImplementationOnce(() => firstPromise);
    // The second call resolves normally.
    const mockSecondResponse = {
      data: {
        choices: [
          {
            message: { content: "Final AI Response" },
          },
        ],
      },
    };
    axios.post.mockResolvedValueOnce(mockSecondResponse);

    await act(async () => {
      render(<Analytics />);
    });

    // Switch to AI tab
    const aiTabButton = screen.getByRole("button", { name: /ai/i });
    fireEvent.click(aiTabButton);

    const questionInput = screen.getByPlaceholderText(/ask a question about your finances/i);
    // Fire first AI request
    fireEvent.change(questionInput, { target: { value: "First question" } });
    fireEvent.keyPress(questionInput, { key: "Enter", code: "Enter", charCode: 13 });

    // Rapidly fire second request
    fireEvent.change(questionInput, { target: { value: "Second question" } });
    fireEvent.click(screen.getByRole("button", { name: /ask/i }));

    // Resolve the first promise as a cancellation (simulate cancellation error)
    act(() => {
      resolveFirst(Promise.reject({ name: "CanceledError" }));
    });

    // Wait for the second response to be rendered
    await waitFor(() => {
      expect(screen.getByText("Final AI Response")).toBeInTheDocument();
    });
  });

  test("testDataLoadErrorHandling - Displays an error toast when loading financial data fails due to an invalid data structure from ExcelJS.", async () => {
    // Force axios.get to always return a dummy ArrayBuffer
    axios.get.mockResolvedValue({ data: new ArrayBuffer(1) });
    
    // Override the ExcelJS.Workbook to simulate an invalid data structure (e.g., empty worksheets array)
    ExcelJS.Workbook.mockImplementation(() => {
      return {
        xlsx: { load: jest.fn().mockResolvedValue(undefined) },
        worksheets: [] // empty worksheets to trigger an error in worksheetToJson
      };
    });
    
    await act(async () => {
      render(<Analytics />);
    });
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
    
    // Verify that the error toast contains the expected translation key
    expect(toast.error.mock.calls[0][0]).toContain("dataLoadError");
  });

  test("testInvestmentPortfolioFiltering - Renders Investment Portfolio tab with proper filtering of investments and accurate rating display", async () => {
    // Setup axios.get mock to handle different files
    axios.get.mockImplementation((url) => {
      if (url.includes("investments.xlsx")) {
        return Promise.resolve({ data: new ArrayBuffer(1) });
      }
      return Promise.resolve({ data: new ArrayBuffer(1) });
    });

    // Override ExcelJS.Workbook for the four files in order:
    // account-balances.xlsx, transactions.xlsx, investments.xlsx, credit-loans.xlsx
    ExcelJS.Workbook.mockClear();
    ExcelJS.Workbook
      .mockImplementationOnce(() => {
        // account-balances.xlsx returns empty data
        return {
          xlsx: { load: jest.fn().mockResolvedValue(undefined) },
          worksheets: []
        };
      })
      .mockImplementationOnce(() => {
        // transactions.xlsx returns empty data
        return {
          xlsx: { load: jest.fn().mockResolvedValue(undefined) },
          worksheets: []
        };
      })
      .mockImplementationOnce(() => {
        // investments.xlsx returns custom data for testing
        const headers = ["Name", "Type", "Performance", "CurrentPrice", "CurrentValue"];
        const dataRows = [
          ["Investment 1", "stocks", 15, 100, null],
          ["Investment 2", "bonds", -5, null, 200],
          ["Investment 3", "stocks", 5, 150, null]
        ];
        const worksheet = {
          getRow: (rowNum) => {
            if (rowNum === 1) {
              return {
                eachCell: (options, cb) => {
                  headers.forEach((header, index) => {
                    cb({ value: header }, index + 1);
                  });
                }
              };
            }
            return {
              eachCell: (options, cb) => {
                const row = dataRows[rowNum - 2];
                if (row) {
                  row.forEach((cell, index) => {
                    cb({ value: cell }, index + 1);
                  });
                }
              }
            };
          },
          eachRow: (options, cb) => {
            dataRows.forEach((row, i) => {
              cb({
                eachCell: (options, cb2) => {
                  row.forEach((cell, index) => {
                    cb2({ value: cell }, index + 1);
                  });
                }
              }, i + 2);
            });
          }
        };
        return {
          xlsx: { load: jest.fn().mockResolvedValue(undefined) },
          worksheets: [worksheet]
        };
      })
      .mockImplementationOnce(() => {
        // credit-loans.xlsx returns empty data
        return {
          xlsx: { load: jest.fn().mockResolvedValue(undefined) },
          worksheets: []
        };
      });

    await act(async () => {
      render(<Analytics />);
    });

    // Switch to Investments tab
    const investmentsTabButton = screen.getByRole("button", { name: /investments/i });
    fireEvent.click(investmentsTabButton);

    // Wait for the Investment Portfolio header to appear
    await waitFor(() => {
      expect(screen.getByText("Investment Portfolio")).toBeInTheDocument();
    });

    // Initially, with "all" filter selected, all investments should appear
    await waitFor(() => {
      expect(screen.getByText("Investment 1")).toBeInTheDocument();
      expect(screen.getByText("Investment 2")).toBeInTheDocument();
      expect(screen.getByText("Investment 3")).toBeInTheDocument();
    });

    // Verify ratings for each investment as per performance values.
    // For Investment 1: Performance = 15 -> rating "keep"
    // For Investment 2: Performance = -5 -> rating "sell"
    // For Investment 3: Performance = 5 -> rating "partialBuyPartialSell"
    expect(screen.getByText(/rating/i).parentElement).toBeDefined();
    expect(screen.getByText((content, node) => {
      return node.textContent.includes("keep");
    })).toBeInTheDocument();
    expect(screen.getByText((content, node) => {
      return node.textContent.includes("sell");
    })).toBeInTheDocument();
    expect(screen.getByText((content, node) => {
      return node.textContent.includes("partialBuyPartialSell");
    })).toBeInTheDocument();

    // Click on the "stocks" filter button
    const stocksButton = screen.getByRole("button", { name: /^stocks$/i });
    fireEvent.click(stocksButton);

    // Only investments with Type "stocks" should appear (Investment 1 and Investment 3)
    await waitFor(() => {
      expect(screen.getByText("Investment 1")).toBeInTheDocument();
      expect(screen.getByText("Investment 3")).toBeInTheDocument();
      expect(screen.queryByText("Investment 2")).not.toBeInTheDocument();
    });

    // Now click on the "bonds" filter button
    const bondsButton = screen.getByRole("button", { name: /^bonds$/i });
    fireEvent.click(bondsButton);

    // Only investments with Type "bonds" should appear (Investment 2)
    await waitFor(() => {
      expect(screen.getByText("Investment 2")).toBeInTheDocument();
      expect(screen.queryByText("Investment 1")).not.toBeInTheDocument();
      expect(screen.queryByText("Investment 3")).not.toBeInTheDocument();
    });
  });
});