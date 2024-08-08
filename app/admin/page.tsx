"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { CartesianGrid, XAxis, Bar, BarChart } from "recharts";
import {
  ChartTooltipContent,
  ChartTooltip,
  ChartContainer,
} from "@/components/ui/chart";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

// Define the Product interface to type the product data
interface Product {
  barcode: string;
  prod_name: string;
  prod_price: number;
}

const Dashboard: React.FC = () => {
  const router = useRouter();
  const updateButtonRef = useRef<HTMLButtonElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProductIndex, setSelectedProductIndex] = useState<number | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string>("prod_name");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [newProduct, setNewProduct] = useState({
    barcode: "",
    prod_name: "",
    prod_price: "",
  });
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [alertOpen, setAlertOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const prodNameInputRef = useRef<HTMLInputElement>(null);
  const prodPriceInputRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
  const alertRefsSub = useRef<(HTMLTableRowElement | null)[]>([]);

  // Fetch products from the server
  const fetchProducts = async () => {
    try {
      const response = await axios.get<Product[]>(
        "http://localhost/phpdata/fetch_products.php"
      );
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products based on the search query
  const handleSearch = useCallback(() => {
    const filtered = products.filter((product) =>
      product.prod_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  useEffect(() => {
    handleSearch();
  }, [searchQuery, handleSearch]);

  // Logout function
  const logout = () => {
    sessionStorage.clear();
    router.push("/");
    toast({ title: "Logged out successfully", variant: "success" });
  };

  // Handle keydown events for various shortcuts
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const key = event.key;

      if (key === "/") {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (key === "Delete" && selectedProductIndex !== null) {
        handleDeleteProduct(filteredProducts[selectedProductIndex].barcode);
        return;
      }

      if (key === "L" && event.shiftKey) {
        logout();
        return;
      }

      handleNavigationAndColumnSelection(event, key);
    },
    [filteredProducts, selectedProductIndex]
  );

  // Handle navigation and column selection
  const handleNavigationAndColumnSelection = useCallback(
    (event: KeyboardEvent, key: string) => {
      switch (key) {
        case "ArrowUp":
          handleArrowUp(event);
          break;
        case "ArrowDown":
          handleArrowDown(event);
          break;
        case "[":
          handleColumnSelection(-1);
          break;
        case "]":
          handleColumnSelection(1);
          break;
        case "Enter":
          handleEnter();
          break;
        default:
          break;
      }
    },
    [selectedColumn, filteredProducts, selectedProductIndex]
  );

  // Handle Arrow Up key press
  const handleArrowUp = (event: KeyboardEvent) => {
    event.preventDefault();
    setSelectedProductIndex((prevIndex) => {
      if (prevIndex === null) {
        return 0; // or any default index you prefer
      }
      const newIndex = prevIndex > 0 ? prevIndex - 1 : prevIndex;
      rowRefs.current[newIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return newIndex;
    });
  };

  // Handle Arrow Down key press
  const handleArrowDown = (event: KeyboardEvent) => {
    event.preventDefault();
    setSelectedProductIndex((prevIndex) => {
      if (prevIndex === null) {
        return 0; // or any default index you prefer
      }
      const newIndex =
        prevIndex < filteredProducts.length - 1 ? prevIndex + 1 : prevIndex;
      rowRefs.current[newIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return newIndex;
    });
  };

  // Handle column selection using [ and ] keys
  const handleColumnSelection = (direction: number) => {
    const columns = ["barcode", "prod_name", "prod_price"];
    const currentIndex = columns.indexOf(selectedColumn);
    const newIndex =
      (currentIndex + direction + columns.length) % columns.length;
    setSelectedColumn(columns[newIndex]);
  };

  // Handle Enter key press
  const handleEnter = () => {
    if (selectedProductIndex !== null) {
      const selectedProduct = filteredProducts[selectedProductIndex];
      console.log("Selected product:", selectedProduct);
    }
  };

  useEffect(() => {
    const handleKeyDownWithRef = (event: KeyboardEvent) => {
      handleKeyDown(event);
    };

    window.addEventListener("keydown", handleKeyDownWithRef);
    return () => {
      window.removeEventListener("keydown", handleKeyDownWithRef);
    };
  }, [handleKeyDown]);

  // Handle adding a new product
  const handleAddProduct = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost/phpdata/add_products.php",
        newProduct
      );
      if (response.data.status === "success") {
        await fetchProducts();
        toast({
          title: "Product added",
          variant: "success",
          description: "Product has been added successfully.",
        });
        setNewProduct({ barcode: "", prod_name: "", prod_price: "" });
        setErrorMessage("");
      } else {
        setErrorMessage(response.data.message);
        toast({
          title: "Error",
          variant: "destructive",
          description: response.data.message,
        });
      }
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  // Handle updating a product
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProduct) {
      try {
        const response = await axios.post(
          "http://localhost/phpdata/update_product.php",
          selectedProduct
        );
        if (response.data.status === "success") {
          await fetchProducts();
          toast({
            title: "Product updated",
            variant: "success",
            description: "Product has been updated successfully.",
          });
          setSelectedProduct(null);
          setAlertOpen(false);
        } else {
          setErrorMessage(response.data.message);
          toast({
            title: "Error",
            variant: "destructive",
            description: response.data.message,
          });
        }
      } catch (error) {
        console.error("Error updating product:", error);
      }
    }
  };

  // Handle deleting a product
  const handleDeleteProduct = async (barcode: string) => {
    console.log("Deleting barcode:", barcode);

    try {
      const response = await axios.post(
        "http://localhost/phpdata/delete_product.php",
        new URLSearchParams({ barcode })
      );

      const data = response.data;
      console.log(data);

      if (data.status === "success") {
        toast({
          title: "Product deleted",
          variant: "success",
          description: "Product has been deleted successfully.",
        });
        fetchProducts();
      } else {
        toast({
          title: "Error",
          variant: "destructive",
          description: data.message,
        });
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        variant: "destructive",
        description: "Failed to delete product.",
      });
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-primary text-primary-foreground py-4 px-6">
        <h1 className="text-2xl font-bold">GAISANO</h1>
      </header>
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[80vh]">
              <div className="flex items-center justify-between max-h-[80vh] mt-4">
                <div className="max-w-[70vw] max-h-[80vh] h-full w-full col-span-2">
                  <input
                    type="text"
                    ref={searchInputRef}
                    placeholder="Search products..."
                    className="mb-4 p-2 border border-gray-400 rounded"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="overflow-y-scroll w-full max-h-[58vh]">
                    <table className="text-xl min-w-full">
                      <thead>
                        <tr className="bg-blue-800 text-white">
                          <th className="bg-blue-800">Barcode</th>
                          <th className="bg-blue-800">Product Name</th>
                          <th className="bg-blue-800">Price</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {filteredProducts.map((product, index) => (
                          <tr
                            key={product.barcode}
                            className={
                              selectedProductIndex === index
                                ? "bg-blue-300"
                                : ""
                            }
                            ref={(el) => {
                              rowRefs.current[index] = el;
                            }}
                            onClick={() => {
                              setSelectedProduct(product);
                              setAlertOpen(true);
                            }}
                          >
                            <td
                              className={`py-4 px-6 text-black ${
                                selectedColumn === "barcode" ? "" : ""
                              }`}
                            >
                              {product.barcode}
                            </td>
                            <td
                              className={`py-4 px-6 text-black ${
                                selectedColumn === "prod_name" ? "" : ""
                              }`}
                            >
                              {product.prod_name}
                            </td>
                            <td
                              className={`py-4 px-6 text-black ${
                                selectedColumn === "prod_price" ? "" : ""
                              }`}
                            >
                              ₱{product.prod_price}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Product Add</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <form className="w-full" onSubmit={handleAddProduct}>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="barcode">Barcode</Label>
                      <Input
                        id="barcode"
                        ref={barcodeInputRef}
                        type="text"
                        placeholder="Barcode"
                        value={newProduct.barcode}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            barcode: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="productName">Product Name</Label>
                      <Input
                        id="productName"
                        ref={prodNameInputRef}
                        type="text"
                        placeholder="Product Name"
                        value={newProduct.prod_name}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            prod_name: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        ref={prodPriceInputRef}
                        type="number"
                        placeholder="Price"
                        value={newProduct.prod_price}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            prod_price: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Add Product
                    </Button>
                  </div>
                </form>
                <Card className="p-3 mt-4">
                  <CardHeader>
                    <CardTitle>Sales by Cashier</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BarchartChart className="aspect-[9/4]" />
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogTrigger className="hidden" />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Product</AlertDialogTitle>
            <AlertDialogDescription>
              <form
                className="w-full"
                onSubmit={handleUpdateProduct}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="updateProductName">Product Name</Label>
                    <Input
                      id="updateProductName"
                      type="text"
                      placeholder="Product Name"
                      value={selectedProduct?.prod_name || ""}
                      onChange={(e) =>
                        setSelectedProduct((prev) => ({
                          ...prev!,
                          prod_name: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="updatePrice">Price</Label>
                    <Input
                      id="updatePrice"
                      type="number"
                      placeholder="Price"
                      value={selectedProduct?.prod_price || 0}
                      onChange={(e) =>
                        setSelectedProduct((prev) => ({
                          ...prev!,
                          prod_price: Number(e.target.value),
                        }))
                      }
                      required
                    />
                  </div>
                </div>
                <button
                  onClick={handleUpdateProduct}
                  className="den"
                  ref={updateButtonRef}
                >
                  Update Product
                </button>
              </form>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Define the properties for the BarchartChart component
interface BarchartChartProps {
  className?: string;
}

function BarchartChart(props: BarchartChartProps) {
  const [chartData, setChartData] = useState([]);
  const [salesDate, setSalesDate] = useState("");

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const response = await axios.get(
          "http://localhost/phpdata/get_all_sales_report.php"
        );
        const data = response.data;

        console.log("Sales data received:", data);

        if (data && data.status === "success") {
          const salesData = data.sales;
          const date = salesData[0].sales_date;
          setSalesDate(date);

          // Define the interfaces for SaleItem and Sale
          interface SaleItem {
            sales_item_prc: string;
            sales_item_qty: number;
          }
          
          interface Sale {
            fName: string;
            lName: string;
            items: SaleItem[];
            sales_date: string;
          }
          
          // Transform the sales data
          const transformedData = salesData.map((sale: Sale) => ({
            cashier: `${sale.fName} ${sale.lName}`,
            sales: sale.items.reduce(
              (total, item) => total + parseFloat(item.sales_item_prc) * item.sales_item_qty,
              0
            ),
          }));
          

          setChartData(transformedData);
        } else {
          setChartData([]);
          setSalesDate("");
        }
      } catch (error) {
        console.error("Error fetching sales data:", error);
      }
    };

    fetchSalesData();
  }, []);

  // Define a color map for different cashiers
  const colorMap = {
    "Giann Legaspi": "#8884d8",
    "Christian Valencia": "#82ca9d",
    "Raz Baldoza": "#ffc658",
  };

  return (
    <div {...props}>
      <ChartContainer
        config={{
          desktop: {
            label: "Desktop",
            color: "hsl(var(--chart-1))",
          },
        }}
        className="min-h-[300px]"
      >
        <BarChart
          width={600}
          height={300}
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="cashier"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Bar
            dataKey="sales"
            radius={8}
            fill={(entry) => colorMap[entry.cashier] || "#000"}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

function FilePenIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22h6a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v10" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10.4 12.6a2 2 0 1 1 3 3L8 21l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

export default Dashboard;
