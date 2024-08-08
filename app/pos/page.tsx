"use client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef, use } from "react";
import axios from "axios";
import { Separator } from "@/components/ui/separator";
import BarcodeScanner from "@/components/Barcode";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Image from "next/image";
import DateTimeDisplay from "@/components/ui/currentTime";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { SideChart } from "@/components/SideCharts";
import ProductsPage from "@/components/Products";
import ProductTable from "@/components/AlertProducts";
// types.ts
export interface Transaction {
  id: number;
  cashier: string;
  items: {
    p_name: string;
    quantity: number;
    total: number;
  }[];
  total: number;
  cashTendered: number;
  change: number;
  date: string;
}

export default function Component() {
  const router = useRouter();
  // const correctPassword = "adminpass";
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<any[]>([]); // Adjust type based on your data
  const [total, setTotal] = useState(0);
  const [cashTendered, setCashTendered] = useState(0);
  const [change, setChange] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [barcodes, setBarcode] = useState("");
  const [fullname, setFullname] = useState("");
  const [userId, setUserId] = useState("");
  const [shiftNumber, setShiftNumber] = useState("");
  const [salesData, setSalesData] = useState([]);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [selectedPending, setSelectedPending] = useState(-1);
  const [selectedItemIndex, setSelectedItemIndex] = useState(-1);

  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>(
    []
  );
  const shiftDrawRef = useRef<HTMLButtonElement>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);
  const quantityRef = useRef<HTMLInputElement>(null);
  const cashTenderedRef = useRef<HTMLInputElement>(null);
  const printReceiptRef = useRef<HTMLButtonElement>(null);
  const openReceiptDialogRef = useRef<HTMLButtonElement>(null);
  const openHotkey = useRef<HTMLButtonElement>(null);
  const saveToPending = useRef<HTMLButtonElement>(null);
  const authDialogTriggerRef = useRef<HTMLButtonElement>(null);
  const submitAuthRef = useRef<HTMLButtonElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedFullname = sessionStorage.getItem("fullname");
    const storedId = sessionStorage.getItem("userId");
    const storedShift = sessionStorage.getItem("shiftNumber");

    if (storedFullname) {
      setFullname(storedFullname);
    }
    if (storedId) {
      setUserId(storedId);
    }
    if (storedShift) {
      setShiftNumber(storedShift);
    }
  }, []);

  useEffect(() => {
    const newTotal = cart.reduce((sum, item) => sum + item.total, 0);
    setTotal(newTotal);
  }, [cart]);

  const getItemsFromCart = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://localhost/phpdata/products.php",
        {
          params: { barcodes },
        }
      );
      const data = response.data;

      // Log data to ensure the correct structure
      console.log("Product data received:", data);

      // Check if the data contains prod_name and prod_price
      if (data && data.prod_name && !isNaN(parseFloat(data.prod_price))) {
        const itemIndex = cart.findIndex(
          (item) => item.prod_name === data.prod_name
        );
        const productPrice = parseFloat(data.prod_price); // Convert prod_price to a number

        if (itemIndex > -1) {
          const updatedCart = [...cart];
          const existingItem = updatedCart[itemIndex];
          const newQuantity = existingItem.quantity + quantity;

          existingItem.quantity = newQuantity;
          existingItem.total = productPrice * newQuantity;

          setCart(updatedCart);
          toast({
            variant: "success",
            description: `Updated quantity for ${data.prod_name} in cart.`,
          });
        } else {
          const newItem = {
            ...data,
            quantity,
            total: productPrice * quantity,
          };
          setCart([...cart, newItem]);
          toast({
            variant: "success",
            description: `Added ${data.prod_name} to cart.`,
          });
        }
      } else {
        toast({
          variant: "destructive",
          description: "Item not found or invalid price.",
        });
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      toast({ variant: "destructive", description: "An error occurred." });
    } finally {
      setLoading(false);
    }
  };

  // Handle barcode input change
  const handleBarcodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBarcode(event.target.value);
  };

  // Handle quantity input change
  const handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuantity(Number(event.target.value));
  };

  const savePendingTransaction = () => {
    if (cart.length === 0) {
      toast({
        variant: "destructive",
        description: "Cannot save an empty transaction.",
      });
      return;
    }

    const currentTransaction = {
      id: Date.now(),
      items: cart,
      total: cart.reduce((sum, item) => sum + item.total, 0),
      cashTendered: 0, // Adjust as needed
      change: 0, // Adjust as needed
      date: new Date().toISOString().split("T")[0],
    };

    const storedTransactions = JSON.parse(
      localStorage.getItem("pendingTransactions") || "[]"
    );
    const newPendingTransactions = [...storedTransactions, currentTransaction];
    localStorage.setItem(
      "pendingTransactions",
      JSON.stringify(newPendingTransactions)
    );

    // Update the state with the new transactions
    setPendingTransactions(newPendingTransactions);
    setCart([]);
    toast({
      variant: "success",
      description: "Transaction saved.",
    });
  };

  const deletePendingTransaction = (index: number) => {
    const newPendingTransactions = pendingTransactions.filter(
      (_, i) => i !== index
    );
    setPendingTransactions(newPendingTransactions);
    localStorage.setItem(
      "pendingTransactions",
      JSON.stringify(newPendingTransactions)
    );
  };

  const retrievePendingTransaction = (index: number) => {
    const transaction = pendingTransactions[index];
    deletePendingTransaction(index);
    setCart(transaction.items);
    toast({
      variant: "success",
      description: "Transaction retrieved.",
    });
  };
  useEffect(() => {
    if (isAuthDialogOpen) {
      // Delay focusing to ensure dialog is fully rendered
      const timeoutId = setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeoutId); // Clean up timeout if dialog is closed before focus
    }
  }, [isAuthDialogOpen]);
  // Key press handling for hotkeys
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      const { key, ctrlKey, shiftKey, code } = event;

      switch (true) {
        // Navigate to Barcode Input: W
        case key === "w":
          event.preventDefault();
          barcodeRef.current?.focus();
          break;

        // Navigate to Quantity Input: Q
        case key === "q" && !ctrlKey:
          event.preventDefault();
          quantityRef.current?.focus();
          break;

        // Navigate to Cash Tendered Input: E
        case key === "e":
          event.preventDefault();
          cashTenderedRef.current?.focus();
          break;

        // Print Receipt: R
        case key === "r":
          event.preventDefault();
          printReceiptRef.current?.click();
          break;

        // Add Item to Cart: Ctrl + Enter
        case key === "Enter" && ctrlKey:
          event.preventDefault();
          getItemsFromCart();
          setBarcode("");

          break;

        // Clear Barcode Input: Ctrl + C
        case key === "c" && ctrlKey:
          event.preventDefault();
          setBarcode("");
          break;
        case key === "x":
          event.preventDefault();
          shiftDrawRef.current?.click();
          break;
        // Clear Quantity Input: Ctrl + Q
        case key === "q" && ctrlKey:
          event.preventDefault();
          setQuantity(1);
          break;

        // Open Receipt Dialog: T
        case key === "t":
          event.preventDefault();
          openReceiptDialogRef.current?.click();
          break;

        // Submit Payment: Ctrl + S
        case key === "s" && ctrlKey:
          event.preventDefault();
          processPayment();
          break;

        // Open Hotkey Guide: Ctrl + H
        case key === "h" && ctrlKey:
          event.preventDefault();
          openHotkey.current?.click();
          break;

        // Start New Transaction: N
        case key === "n":
          event.preventDefault();
          newTransaction();
          break;

        // Void Cart: V
        case key === "o":
          event.preventDefault();
          setIsAuthDialogOpen(true);
          authDialogTriggerRef.current?.click();
          break;

        // Submit Authorization for Void Cart: Ctrl + B
        case key === "v":
          event.preventDefault();
          handleAuthSubmit("voidCart");
          break;

        // Navigate Pending Transactions: Next [ and Previous ]
        case key === "[":
          event.preventDefault();
          setSelectedPending((prevIndex) =>
            prevIndex < pendingTransactions.length - 1
              ? prevIndex + 1
              : prevIndex
          );
          break;

        case key === "]":
          event.preventDefault();
          setSelectedPending((prevIndex) =>
            prevIndex > 0 ? prevIndex - 1 : prevIndex
          );
          break;

        // Generate Z Report: Ctrl + Z
        case key === "z":
          event.preventDefault();
          handleAuthSubmit("generateReport");
          break;

        // Navigate Cart Items: Arrow Up and Arrow Down
        case key === "ArrowDown":
          event.preventDefault();
          setSelectedItemIndex((prevIndex) =>
            prevIndex < cart.length - 1 ? prevIndex + 1 : prevIndex
          );
          break;

        case key === "ArrowUp":
          event.preventDefault();
          setSelectedItemIndex((prevIndex) =>
            prevIndex > 0 ? prevIndex - 1 : prevIndex
          );
          break;

        // Show Pending Transactions: D
        // case key === "d":
        //   event.preventDefault();
        //   showPendingTransactions();
        //   break;

        // Retrieve Pending Transaction: A
        case key === "a":
          event.preventDefault();
          if (selectedPending >= 0) {
            retrievePendingTransaction(selectedPending);
          }
          break;

        // Save to Pending: F
        case key === "f":
          event.preventDefault();
          saveToPending.current?.click();
          break;
        case shiftKey && code === "ShiftLeft" && selectedItemIndex >= 0:
          event.preventDefault();
          if (cart.length > 0) {
            const newQuantity = prompt("Enter new quantity:");
            if (newQuantity !== null && !isNaN(Number(newQuantity))) {
              const parsedQuantity = parseInt(newQuantity, 10);
              const updatedCart = cart.map((item, index) =>
                index === selectedItemIndex
                  ? {
                      ...item,
                      quantity: parsedQuantity,
                      total: parseFloat(item.prod_price) * parsedQuantity, // Ensure prod_price is a number
                    }
                  : item
              );
              setCart(updatedCart);
              setSelectedItemIndex(-1);
              toast({
                variant: "success",
                description: "Quantity updated.",
              });
            }
          } else {
            toast({
              variant: "destructive",
              description: "Cannot update quantity. The cart is empty.",
            });
          }
          break;
        // Delete Selected Item: Shift Right
        case shiftKey && code === "ShiftRight" && selectedItemIndex >= 0:
          event.preventDefault();
          if (cart.length > 0) {
            const newCart = cart.filter(
              (_, index) => index !== selectedItemIndex
            );
            setCart(newCart);
            setSelectedItemIndex(-1);
            toast({
              variant: "success",
              description: "Item deleted from cart.",
            });
          } else {
            toast({
              variant: "destructive",
              description: "Cannot delete item. The cart is empty.",
            });
          }
          break;
        // Generate Report: Shift + G
        case key === "g":
          event.preventDefault();
          // generateShiftReport();
          printShiftReport();
          break;

        // Logout: Shift + L
        case key === "L" && shiftKey:
          event.preventDefault();
          logout();
          break;

        default:
          break;
      }
    },
    [
      cart,
      selectedItemIndex,
      pendingTransactions,
      barcodeRef,
      quantityRef,
      cashTenderedRef,
      printReceiptRef,
      openReceiptDialogRef,
      openHotkey,
      setIsAuthDialogOpen,
      authDialogTriggerRef,

      setSelectedPending,

      retrievePendingTransaction,
      setBarcode,
      setQuantity,
      saveToPending,
    ]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);
  // const showPendingTransactions = () => {
  //   // Optionally, scroll to the pending transactions table or open a modal
  //   console.log("Displaying pending transactions:");
  //   setSelectedPending(0); // Optionally set the selected pending transaction to the first one
  //   // You could also use a state to show or hide a modal containing pending transactions
  // };
  const newTransaction = () => {
    setCart([]);
    setTotal(0);
    setCashTendered(0);
    setChange(0);
    setBarcode("");
    setQuantity(1);
    setFullname(""); // Clear cashier's name or set it to the default if needed
    toast({
      variant: "success",
      description: "New transaction started.",
    });
  };
  // Effect for adding and removing keydown event listener
  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  const processPayment = async () => {
    if (cart.length === 0) {
      toast({
        variant: "destructive",
        description: "Cannot process payment. The cart is empty.",
      });
      return;
    }

    if (cashTendered >= total) {
      const changeAmount = cashTendered - total;
      setChange(changeAmount);

      const transaction = {
        cashier: sessionStorage.getItem("fullname"),
        items: cart,
        total,
        cashTendered,
        change: changeAmount,
        date: new Date().toISOString(),
        shiftNumber: sessionStorage.getItem("userId"),
      };

      try {
        const response = await axios.post(
          "http://localhost/phpdata/process_payment.php",
          transaction
        );

        if (response.data.status === "success") {
          toast({
            variant: "success",
            description: `Payment processed. Change: ₱${changeAmount.toFixed(
              2
            )}`,
          });

          printReceipt();
          fetchSalesData();
          console.log(transaction);
          newTransaction();
        } else {
          toast({
            variant: "destructive",
            description: response.data.message || "Payment failed.",
          });
        }
      } catch (error) {
        console.error("Error processing payment:", error);

        const errorMessage =
          error.response?.data?.message || "An unknown error occurred.";

        toast({
          variant: "destructive",
          description: errorMessage,
        });
      }
    } else {
      toast({
        variant: "destructive",
        description: "Insufficient cash tendered.",
      });
    }
  };
  // const saveShiftReport = (transaction) => {
  //   const reports = JSON.parse(localStorage.getItem("shiftReports") || "[]");
  //   console.log("Stored reports:", reports);

  //   reports.push(transaction);

  //   localStorage.setItem("shiftReports", JSON.stringify(reports));
  // };
  const [cashierName, setCashierName] = useState("");
  const fetchSalesData = async () => {
    try {
      const response = await axios.get(
        "http://localhost/phpdata/get_sales_report.php",
        {
          params: { userId: sessionStorage.getItem("userId") },
        }
      );
      if (response.data.status === "success") {
        const sales = response.data.sales;
        setSalesData(sales);

        if (sales.length > 0) {
          // Extract the cashier's name from the first sale record
          const firstSale = sales[0];
          setCashierName(
            `${firstSale.fName} ${firstSale.lName}` || `(${firstSale.username})`
          );
        }
      } else {
        console.error("Failed to fetch sales data:", response.data.error);
      }
    } catch (error) {
      console.error("Error fetching sales data:", error);
    }
  };
  useEffect(() => {
    fetchSalesData();
  }, []);
  const printShiftReport = () => {
    if (salesData.length === 0) {
      toast({
        variant: "destructive",
        description: "No sales data available to print.",
      });
      console.error("No sales data available to print.");
      return;
    }

    const reportHtml = `
    <html>
      <head>
        <title>Shift Sales Report</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            justify-content: center;
            align-items: center;
          }
          .report {
            margin: 0 auto;
            width: 300px;
            border: 1px dashed #000;
            padding: 20px;
            background-color: #fff;
          }
          .header {
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
          }
          .item {
            margin-bottom: 10px;
          }
          .item h3 {
            margin: 0;
            padding: 0;
            font-size: 14px;
          }
          .item p {
            margin: 0;
            padding: 0;
            font-size: 12px;
          }
          .items-list {
            margin-top: 10px;
          }
          .items-list li {
            list-style-type: none;
            font-size: 12px;
            margin-bottom: 5px;
          }
          .total {
            font-weight: bold;
            border-top: 1px dashed #000;
            padding-top: 10px;
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
          }
        </style>
      </head>
      <body>
        <div class="report">
          <div class="header">Shift Sales Report</div>
          ${
            cashierName
              ? `<div class="header">Cashier: ${cashierName}</div>`
              : ""
          }
          ${salesData
            .map(
              (sale) => `
              <div class="item">
                <h3>Sale ID: ${sale.sales_id}</h3>
                <p>Date: ${new Date(sale.sales_date).toLocaleString()}</p>
                <p>Total Amount: ₱${sale.sales_totalAmount}</p>
                <h4 class="items-list">Items:</h4>
                <ul class="items-list">
                  ${sale.items
                    .map(
                      (item) => `
                    <li>${item.prod_name} - Quantity: ${item.sales_item_qty} - Price: ₱${item.sales_item_prc}</li>
                  `
                    )
                    .join("")}
                </ul>
                <hr>
              </div>
            `
            )
            .join("")}
        </div>
      </body>
    </html>
  `;

    const printWindow = window.open("", "", "width=600,height=800");
    printWindow.document.open();
    printWindow.document.write(reportHtml);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // const generateShiftReport = () => {
  //   const reports = JSON.parse(localStorage.getItem("shiftReports")) || [];
  //   console.log("All reports:", reports);

  //   const currentCashier = localStorage.getItem("fullname");
  //   const currentShift = localStorage.getItem("id");

  //   const filteredReports = reports.filter(
  //     (report) =>
  //       report.cashier === currentCashier && report.shiftNumber === currentShift
  //   );

  //   const grandTotal = filteredReports.reduce((sum, t) => sum + t.total, 0);

  //   const reportHtml = `
  //   <html>
  //     <head>
  //       <title>Shift Report</title>
  //       <style>
  //         body {
  //           font-family: 'Courier New', monospace;
  //           justify-content: center;
  //           align-items: center;
  //         }
  //         .report {
  //           margin: 0 auto;
  //           width: 300px;
  //           border: 1px dashed #000;
  //           padding: 20px;
  //           background-color: #fff;
  //         }
  //         .header {
  //           font-size: 16px;
  //           font-weight: bold;
  //           text-align: center;
  //           margin-bottom: 20px;
  //           border-bottom: 1px dashed #000;
  //           padding-bottom: 10px;
  //         }
  //         .item {
  //           margin-bottom: 10px;
  //           display: flex;

  //         }
  //         .item div {
  //           width: 45%;
  //           padding: 5px;
  //         }
  //         .total {
  //           font-weight: bold;
  //           border-top: 1px dashed #000;
  //           padding-top: 10px;
  //           margin-top: 20px;
  //           display: flex;
  //           justify-content: space-between;
  //         }
  //       </style>
  //     </head>
  //     <body>
  //       <div class="report">
  //    <div class="header">GAISANO</div>
  //         <div class="header">Shift Report for Shift ${currentShift}</div>
  //         ${filteredReports
  //           .map(
  //             (transaction) => `
  //               <div class="item">
  //                 <div>Cashier:</div>
  //                 <div>${transaction.cashier}</div>
  //               </div>
  //               <div class="item">
  //                 <div>Date:</div>
  //                 <div>${transaction.date}</div>
  //               </div>
  //               <div class="item">
  //                 <div>Total:</div>
  //                 <div>₱${transaction.total.toFixed(2)}</div>
  //               </div>
  //               <hr>
  //             `
  //           )
  //           .join("")}
  //         <div class="total">
  //           <div>Grand Total:</div>
  //           <div>₱${grandTotal.toFixed(2)}</div>
  //         </div>
  //       </div>
  //     </body>
  //   </html>
  // `;

  //   const reportWindow = window.open("", "", "width=800,height=600");
  //   if (reportWindow) {
  //     reportWindow.document.open();
  //     reportWindow.document.write(reportHtml);
  //     reportWindow.document.close();
  //     reportWindow.focus();
  //     // reportWindow.print(); // Uncomment to automatically print the report
  //   }
  // };

  const printZReport = async () => {
    try {
      // Fetch sales data for all cashiers
      const response = await axios.get(
        "http://localhost/phpdata/get_all_sales_report.php"
      );

      if (response.data.status !== "success") {
        throw new Error(response.data.message || "Failed to fetch sales data");
      }

      const salesData = response.data.sales;

      // Check if salesData is an array
      if (!Array.isArray(salesData)) {
        throw new Error("Invalid sales data format");
      }

      // Group sales by cashier
      const cashierSales = salesData.reduce((acc, sale) => {
        const cashierName = `${sale.fName} ${sale.lName}`;
        if (!acc[cashierName]) {
          acc[cashierName] = [];
        }
        acc[cashierName].push(sale);
        return acc;
      }, {});

      // Calculate the grand total of all sales
      const grandTotal = Object.values(cashierSales).reduce(
        (total, cashierSalesList) =>
          total +
          cashierSalesList.reduce(
            (sum, sale) => sum + parseFloat(sale.sales_totalAmount),
            0
          ),
        0
      );

      // Generate the HTML for the Z report
      const reportHtml = `
      <html>
        <head>
          <title>Z Report</title>
          <style>
            body { font-family: 'Courier New', monospace; }
            .report { width: 300px; margin: auto; }
            .header, .footer { text-align: center; font-weight: bold; }
            .cashier-section { margin-bottom: 20px; }
            .sale-item { margin-left: 20px; }
            .total { border-top: 1px solid #000; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="report">
            <div class="header">GAISANO</div>
            <div class="header">Z Report</div>
            ${Object.entries(cashierSales)
              .map(
                ([cashierName, sales]) => `
                <div class="cashier-section">
                  <div>Cashier: ${cashierName}</div>
                  ${sales
                    .map(
                      (sale) => `
                      <div>
                        <div>Sale ID: ${sale.sales_id}</div>
                        <div>Date: ${new Date(
                          sale.sales_date
                        ).toLocaleString()}</div>
                        <div>Total Amount: ₱${sale.sales_totalAmount}</div>
                        <div>Items:</div>
                        ${sale.items
                          .map(
                            (item) => `
                            <div class="sale-item">
                              ${item.prod_name} - Quantity: ${item.sales_item_qty} - Price: ₱${item.sales_item_prc}
                            </div>
                          `
                          )
                          .join("")}
                      </div>
                      <hr />
                    `
                    )
                    .join("")}
                </div>
              `
              )
              .join("")}
            <div class="footer">
              Grand Total: ₱${grandTotal.toFixed(2)}
            </div>
          </div>
        </body>
      </html>
    `;

      // Open the report in a new window
      const reportWindow = window.open("", "", "width=800,height=600");
      if (reportWindow) {
        reportWindow.document.open();
        reportWindow.document.write(reportHtml);
        reportWindow.document.close();
        reportWindow.focus();
        // Uncomment the line below to automatically print the report
        // reportWindow.print();
      }
    } catch (error) {
      console.error("Error generating Z report:", error);
    }
  };

  const logout = () => {
    const shiftReports = localStorage.getItem("shiftReports");

    // Clear all local storage
    sessionStorage.clear();

    // Restore the shift reports
    if (shiftReports) {
      localStorage.setItem("shiftReports", shiftReports);
    }

    // Redirect to login page and show a success toast
    router.push("/");
    toast({ title: "Logged out successfully", variant: "success" });
  };

  // Function to print the receipt
  const printReceipt = () => {
    // Get the cashier's name and current date/time
    const cashier = sessionStorage.getItem("fullname");
    const currentDateTime = new Date().toLocaleString();

    // Generate the receipt content
    let receiptContent = `
    <html>
      <head>
        <title>Receipt</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; margin: 0; padding: 0; }
          .receipt { max-width: 300px; margin: 0 auto; padding: 10px; border: 1px solid #000; }
          .header, .footer { text-align: center; font-weight: bold; margin-bottom: 10px; }
          .item { display: flex; justify-content: space-between; }
          .item p, .item div { margin: 0; padding: 0; }
          .total, .footer p { margin-top: 10px; font-weight: bold; }
          .separator { border-bottom: 1px dashed #000; margin: 5px 0; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <p>Gaisano</p>
            <p>Dara Carmen</p>
            <p>Atbang 7/11</p>
            <p>${currentDateTime}</p>
            <p>Cashier: ${cashier}</p>
            <p>===============================</p>
          </div>
          <div class="items">
  `;

    // Add items to the receipt
    cart.forEach((item) => {
      receiptContent += `
      <div class="item">
        <div>${item.prod_name} x${item.quantity}</div>
        <div>₱${(item.prod_price * item.quantity).toFixed(2)}</div>
      </div>
    `;
    });

    // Add the total and change
    receiptContent += `
          <div class="separator"></div>
          <div class="item total">
            <div>Total:</div>
            <div>₱${total.toFixed(2)}</div>
          </div>
          <div class="item">
            <div>Cash Tendered:</div>
            <div>₱${cashTendered.toFixed(2)}</div>
          </div>
          <div class="item">
            <div>Change:</div>
            <div>₱${change.toFixed(2)}</div>
          </div>
          <div class="separator"></div>
          <div class="footer">
            <p>Thank you for shopping!</p>
            <p>===============================</p>
          </div>
        </div>
      </body>
    </html>
  `;

    // Open the receipt in a new window and print it
    const receiptWindow = window.open("", "", "width=400,height=600");
    receiptWindow.document.write(receiptContent);
    receiptWindow.document.close();
    // receiptWindow.print();
  };

  const handleAuthSubmit = async (action: "voidCart" | "generateReport") => {
    try {
      // Fetch the admin password from the server or local storage
      const response = await axios.get(
        "http://localhost/phpdata/getAdminPassword.php"
      );

      const adminPasswordFromDb = response.data.password;

      if (adminPassword === adminPasswordFromDb) {
        if (action === "voidCart") {
          voidCart();
        } else if (action === "generateReport") {
          printZReport();
          // toast({
          //   variant: "success",
          //   description: "Z Report generated successfully.",
          // });
        }
        setAdminPassword("");
        setIsAuthDialogOpen(false);
      } else {
        toast({
          variant: "destructive",
          description: "Invalid admin password.",
        });
      }
    } catch (error) {
      console.error("Error fetching admin password:", error);
      toast({
        variant: "destructive",
        description: "An error occurred while verifying the admin password.",
      });
    }
  };

  const voidCart = () => {
    if (cart.length === 0) {
      toast({
        variant: "destructive",
        description: "Cart is already empty.",
      });
      return;
    }

    setCart([]);
    setTotal(0);
    setCashTendered(0);
    setChange(0);
    setBarcode("");
    setQuantity(1);

    toast({
      variant: "success",
      description: "Cart has been voided.",
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-6 w-full h-[100vh] max-w-10xl mx-auto p-4 md:p-6">
      <div
        id="cashiersTab"
        className="flex flex-col gap-4 bg-zinc-800 text-white rounded-sm p-6 col-span-2"
      >
        <div className="p-4  rounded-sm bg-white">
          {" "}
          <Image src={"/LOGO.jpg"} alt="Logo" width={500} height={300} />
        </div>
        <div className="text-white">
          <DateTimeDisplay />
        </div>{" "}
        <pre className="text-3xl text-wrap">Cashier: {fullname}</pre>
        <pre className="animate-pulse"> Show Hotkeys (Ctrl + H)</pre>
        <Drawer>
          <DrawerTrigger ref={shiftDrawRef} className="hidden">
            Open
          </DrawerTrigger>
          <DrawerContent
            style={{ height: "70vh" }}
            className="flex items-center"
          >
            <DrawerHeader className="flex items-center justify-center w-full">
              <DrawerDescription className="flex items-center justify-center w-full">
                <div>
                  <div className="p-5 w-[50vw] mx-auto items-center justify-center bg-white border border-dashed border-gray-400 max-h-[60vh] overflow-y-scroll">
                    <h1 className="text-center text-xl font-bold border-b border-dashed border-gray-400 pb-2 mb-5">
                      Shift Sales Report
                    </h1>
                    {cashierName && (
                      <h2 className="text-center text-lg mb-4">
                        Cashier: {cashierName}
                      </h2>
                    )}
                    {salesData.length > 0 ? (
                      salesData.map((sale, index) => (
                        <div
                          key={index}
                          className="mb-4  justify-center flex flex-col text-left"
                        >
                          <h3 className="text-base font-semibold mb-1">
                            Sale ID: {sale.sales_id}
                          </h3>
                          <p className="text-sm mb-1">
                            Date: {new Date(sale.sales_date).toLocaleString()}
                          </p>
                          <p className="text-sm mb-2 font-semibold">
                            Total Amount: ₱{sale.sales_totalAmount}
                          </p>
                          <h4 className="text-sm font-semibold mb-1">Items:</h4>
                          <ul className="list-none pl-0 text-sm">
                            {sale.items.map((item, idx) => (
                              <li key={idx} className="mb-1">
                                {item.prod_name} - Quantity:{" "}
                                {item.sales_item_qty} - Price: ₱
                                {item.sales_item_prc}
                              </li>
                            ))}
                          </ul>
                          <hr className="border-dashed border-t-2 border-gray-400 mt-2" />
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-sm">
                        No sales data available.
                      </p>
                    )}
                  </div>

                  {/* <SideChart /> */}
                </div>
              </DrawerDescription>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>
        <button
          onClick={savePendingTransaction}
          ref={saveToPending}
          className="hidden"
        >
          Save Transaction
        </button>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="lg"
              className="hidden"
              ref={openHotkey}
            >
              Show Hotkeys (Ctrl + H)
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-zinc-900  border-zinc-800 ">
            <SheetHeader>
              <SheetTitle className="text-blue-300">Hotkeys</SheetTitle>
              <SheetDescription>
                <div className="bg-white p-6 w-80 rounded-lg shadow-md border border-gray-200">
                  <div className="overflow-y-auto max-h-[80vh]">
                    <ul className="list-none p-0 m-0 space-y-2 text-gray-900">
                      <li className="text-blue-600 font-semibold">
                        <strong>W</strong>: Focus on Barcode Input
                      </li>
                      <li className="text-blue-600 font-semibold">
                        <strong>Q</strong>: Focus on Quantity Input
                      </li>
                      <li className="text-blue-600 font-semibold">
                        <strong>E</strong>: Focus on Cash Tendered Input
                      </li>
                      <li className="text-blue-600 font-semibold">
                        <strong>Ctrl + Enter</strong>: Add Item to Cart
                      </li>
                      <li className="text-blue-600 font-semibold">
                        <strong>Ctrl + C</strong>: Clear Barcode Input
                      </li>
                      <li className="text-blue-600 font-semibold">
                        <strong>Ctrl + Q</strong>: Clear Quantity Input
                      </li>
                      <li className="text-blue-600 font-semibold">
                        <strong>Ctrl + S</strong>: Submit Payment
                      </li>
                      <li className="text-blue-600 font-semibold">
                        <strong>Ctrl + H</strong>: Open Hotkey Guide
                      </li>
                      <li className="text-blue-600 font-semibold">
                        <strong>Ctrl + Z</strong>: Generate Z Report (Admin Auth
                        Required)
                      </li>
                      <li className="text-blue-600 font-semibold">
                        <strong>Shift + Left</strong>: Update Quantity
                      </li>
                      <li className="text-blue-600 font-semibold">
                        <strong>Shift + Right</strong>: Delete Selected Item
                      </li>
                      <li className="text-blue-600 font-semibold">
                        <strong>Shift + L</strong>: Logout
                      </li>
                      <li className="text-blue-600 font-semibold">
                        <strong>T</strong>: Open Receipt Dialog
                      </li>
                      <li className="text-blue-600 font-semibold">
                        <strong>R</strong>: Print Receipt
                      </li>
                      <li className="text-blue-600 font-semibold">
                        <strong>N</strong>: Start New Transaction
                      </li>
                      <li className="text-blue-600 font-semibold">
                        <strong>O</strong>: Void Cart Authorization
                      </li>
                      <li className="text-blue-600 font-semibold">
                        <strong>V</strong>: Void Cart (Admin Auth Required)
                      </li>
                      <li className="text-blue-600 font-semibold">
                        <strong>X</strong>: Toggle Shift Drawer
                      </li>
                      <li className="text-blue-600 font-semibold">
                        <strong>Arrow Up/Down</strong>: Navigate Cart Items
                      </li>
                      <li className="text-blue-600 font-semibold">
                        <strong>[</strong>: Navigate Next Pending Transaction
                      </li>
                      <li className="text-blue-600 font-semibold">
                        <strong>]</strong>: Navigate Previous Pending
                        Transaction
                      </li>
                      <li className="text-blue-600 font-semibold">
                        <strong>A</strong>: Retrieve Pending Transaction
                      </li>
                      <li className="text-blue-600 font-semibold">
                        <strong>F</strong>: Save to Pending
                      </li>
                      <li className="text-blue-600 font-semibold">
                        <strong>G</strong>: Generate Shift Report
                      </li>
                    </ul>
                  </div>
                </div>
              </SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
        <Drawer>
          <DrawerTrigger>test</DrawerTrigger>
          <DrawerContent>
            {" "}
            {/* <ProductsPage /> */}
            <SideChart />
          </DrawerContent>
        </Drawer>
        <div className="block border rounded-sm  bg-blue-100">
          <div className="max-h-[300px] overflow-y-auto border border-gray-200">
            <Table className="text-xl min-w-full">
              <TableHeader>
                <TableRow className="bg-blue-800 ">
                  <TableHead className="bg-blue-800 row-span-3 w-full">
                    Pending
                  </TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTransactions.map((transaction, index) => (
                  <TableRow
                    key={transaction.id}
                    className={selectedPending === index ? "bg-blue-300" : ""}
                  >
                    <TableCell className="py-4 px-6 text-black">
                      <button
                        onClick={() => retrievePendingTransaction(index)}
                        className="hidden"
                      >
                        Retrieve
                      </button>
                      Transaction #{index + 1}
                    </TableCell>

                    <TableCell className="py-4 px-6 text-black">
                      ₱{transaction.total.toFixed(2)}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-black">
                      {transaction.date}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div
        id="inputsTab"
        className="flex flex-col gap-4 bg-zinc-800 text-white rounded-sm p-6 col-span-5 h-full"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="barcode">Barcode</Label>
            <Input
              id="barcode"
              placeholder="Scan barcode"
              className="text-xl text-black py-4 px-6 h-14"
              value={barcodes}
              onChange={handleBarcodeChange}
              ref={barcodeRef}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="text"
              value={quantity}
              min={1}
              className="text-xl py-4 px-6 h-14 text-black"
              onChange={handleQuantityChange}
              ref={quantityRef}
            />
          </div>
        </div>
        <div className="flex-1 border rounded-lg overflow-auto bg-blue-100">
          {/* <ProductTable />  */}
          <AlertDialog
            open={isAuthDialogOpen}
            onOpenChange={setIsAuthDialogOpen}
          >
            <AlertDialogTrigger ref={authDialogTriggerRef} className="hidden">
              Open Auth Dialog
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader className="text-4xl font-bold text-blue-800">
                Admin Authorization
              </AlertDialogHeader>
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-blue-400">
                  Admin Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  ref={passwordInputRef}
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                {/* <button
                  type="button"
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                  onClick={handleAuthSubmit}
                >
                  Submit
                </button> */}
                {/* <button
                  type="button"
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                  onClick={() => setIsAuthDialogOpen(false)}
                >
                  Cancel
                </button> */}
              </div>
            </AlertDialogContent>
          </AlertDialog>
          <Table className="text-xl">
            <TableHeader>
              <TableRow className="bg-blue-800 ">
                <TableHead className="text-white ">Barcode</TableHead>
                <TableHead className="text-white ">Item</TableHead>
                <TableHead className="text-white ">Qty</TableHead>
                <TableHead className="text-white ">Price</TableHead>
                <TableHead className="text-white ">Total</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {cart.map((item, index) => (
                <TableRow
                  key={index}
                  className={selectedItemIndex === index ? "bg-blue-300" : ""}
                >
                  {" "}
                  <TableCell className="py-4 px-6 text-black">
                    {item.barcode}
                  </TableCell>
                  <TableCell className="py-4 px-6 text-black">
                    {item.prod_name}
                  </TableCell>
                  <TableCell className="py-4 px-6 text-black">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="py-4 px-6 text-black">
                    ₱{item.price}
                  </TableCell>
                  <TableCell className="py-4 px-6 text-black">
                    ₱{item.total}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <h1 className="text-5xl">Total: ₱{total}</h1>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cash-tendered">Cash Tendered</Label>
            <Input
              id="cash-tendered"
              type="number"
              value={cashTendered}
              min={0}
              className="text-xl text-black py-4 px-6 h-14"
              onChange={(e) => setCashTendered(Number(e.target.value))}
              ref={cashTenderedRef}
            />
          </div>
          {/* <div className="space-y-2">
            <Label htmlFor="change">Change</Label>
            <h1
              id="change"
              className="text-xl bg-white rounded-sm text-black py-4 px-6 h-14"
            >
              PHP &nbsp;
              {change}
            </h1>
          </div> */}
          <Button
            variant="outline"
            size="lg"
            className="py-3 px-6 hidden"
            ref={printReceiptRef}
            onClick={printReceipt}
          >
            Print
          </Button>
        </div>
        <AlertDialog>
          <AlertDialogTrigger className="hidden " ref={openReceiptDialogRef}>
            Open Receipt
          </AlertDialogTrigger>
          <AlertDialogContent className=" bg-zinc-800 rounded-sm border-zinc-800">
            {" "}
            <div
              id="receiptTab"
              className="flex flex-col gap-4 p-6 bg-zinc-800 rounded-sm col-span-2"
            >
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Receipt</h3>
                </div>
                <Separator />

                <div className="space-y-2 text-lg">
                  <ScrollArea className="h-[70vh] w-[100%] rounded-md border p-4 bg-blue-300">
                    {cart.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <span>
                          {item.p_name} x {item.quantity}
                        </span>

                        <span>₱{item.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </ScrollArea>
                  <Separator />

                  <div className="pt-2 flex text-white items-center justify-between font-bold">
                    <div>
                      {" "}
                      <span>Total:</span>
                      <span>₱{total.toFixed(2)}</span>
                    </div>
                    <div>
                      <span>Change:</span>
                      <span>₱{cashTendered - total}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
