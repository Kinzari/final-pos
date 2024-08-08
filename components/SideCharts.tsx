"use client";

import { TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import axios from "axios";

const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function SideChart() {
  const [chartData, setChartData] = useState([]);
  const [salesDate, setSalesDate] = useState("");

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        // Replace with your actual backend endpoint to fetch sales data
        const response = await axios.get(
          "http://localhost/phpdata/cashier_sales.php"
        );
        const data = response.data;

        // Log the response data to verify its structure
        console.log("Sales data received:", data);

        // Ensure data contains the correct product information
        if (data && data.length > 0) {
          const date = data[0].sales_date; // Assuming all entries are from the same date
          setSalesDate(date);

          // Transform the data to match the structure required by Recharts
          const transformedData = data.map((item) => ({
            cashier: item.cashier_name,
            sales: parseFloat(item.total_sales), // Ensure it's a number
          }));

          setChartData(transformedData);
        } else {
          setChartData([]);
          setSalesDate(""); // No sales data for the day
        }
      } catch (error) {
        console.error("Error fetching sales data:", error);
      }
    };

    fetchSalesData();
  }, []);

  return (
    <div className="flex flex-col h-[50vh]">
      <h1>Sales for cashiers</h1>
      {salesDate ? new Date(salesDate).toLocaleDateString() : "No Data"}
      <ChartContainer config={chartConfig}>
        <BarChart
          accessibilityLayer
          data={chartData}
          layout="vertical"
          //   barCategoryGap={2}
          //   barGap={2} // Adjusted gap between bars
          //   width={200} // Adjusted width for a smaller chart
          //   height={950} // Adjusted height for a smaller chart
          //   margin={{
          //     left: 10, // Adjusted margin for better alignment
          //     right: 30, // Adjusted margin for better alignment
          //   }}
        >
          <XAxis type="number" dataKey="sales" hide />
          <YAxis
            dataKey="cashier"
            type="category"
            tickLine={false}
            // tickMargin={10}
            //   width={200} // Adjusted width for a smaller chart

            axisLine={false}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Bar
            dataKey="sales"
            fill="var(--color-sales)"
            barSize={20} // Set bar height (thickness) here
            radius={5}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
