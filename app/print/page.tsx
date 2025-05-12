"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PrintPassbook() {
  const [accountNumber, setAccountNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handlePrint = async (apiEndpoint: string) => {
    if (!accountNumber) {
      setError("กรุณาระบุหมายเลขบัญชี");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accountNumber }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "เกิดข้อผิดพลาด");
      }

      // เปิดหน้าพิมพ์ในแท็บใหม่
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const printWindow = window.open(url, "_blank");
      if (!printWindow) {
        throw new Error("ไม่สามารถเปิดหน้าต่างพิมพ์");
      }

    } catch (err) {
      setError(err.message);
      console.error("Print error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintAccount = () => handlePrint("/api/pass-book-account");
  const handlePrintTransactions = () => handlePrint("/api/pass-book-trans");

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">พิมพ์สมุดบัญชี</h1>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            หมายเลขบัญชี
          </label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="กรอกหมายเลขบัญชี"
          />
        </div>

        {error && (
          <div className="mb-4 text-red-500 text-sm">{error}</div>
        )}

        <div className="flex flex-col space-y-3">
          <button
            onClick={handlePrintAccount}
            disabled={loading}
            className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
          >
            {loading ? "กำลังประมวลผล..." : "พิมพ์ข้อมูลบัญชี"}
          </button>

          <button
            onClick={handlePrintTransactions}
            disabled={loading}
            className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 disabled:bg-green-300"
          >
            {loading ? "กำลังประมวลผล..." : "พิมพ์รายการธุรกรรม"}
          </button>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h2 className="font-bold mb-2">ตัวอย่างการพิมพ์</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <h3 className="font-medium">ข้อมูลบัญชี</h3>
              <div className="text-xs mt-2 p-2 border">
                <p>สมุดบัญชีธนาคาร</p>
                <p>เลขที่บัญชี: 123-456-7890</p>
                <p>ชื่อบัญชี: นายตัวอย่าง ทดสอบ</p>
                <p>ยอดคงเหลือ: 10,000.00 บาท</p>
              </div>
            </div>
            <div>
              <h3 className="font-medium">รายการธุรกรรม</h3>
              <div className="text-xs mt-2 p-2 border">
                <p>01/01/2566 DEP 1,000.00 10,000.00 aaa</p>
                <p>02/01/2566 WD -500.00 9,500.00 aaa</p>
                <p>03/01/2566 DEP 2,000.00 11,500.00 aaa</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}