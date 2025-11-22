import { useRef } from 'react';
import Button from './ui/Button';

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

interface ReceiptProps {
  orderNumber: number;
  items: ReceiptItem[];
  total: number;
  timestamp: string;
  onClose: () => void;
}

/**
 * Receipt Component
 * Displays order receipt with download option
 * Shows order details in a printable format
 */
function Receipt({ orderNumber, items, total, timestamp, onClose }: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  /**
   * Download receipt as text file
   */
  const handleDownload = () => {
    const receiptText = generateReceiptText();
    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${orderNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Generate plain text receipt content
   */
  const generateReceiptText = () => {
    const lines = [
      '================================',
      '     BOBA POS SYSTEM',
      '================================',
      '',
      `Order #: ${orderNumber}`,
      `Date: ${new Date(timestamp).toLocaleString()}`,
      '',
      '--------------------------------',
      'ITEMS',
      '--------------------------------',
      '',
      ...items.map(item => 
        `${item.name}\n  ${item.quantity} x $${item.price.toFixed(2)} = $${(item.quantity * item.price).toFixed(2)}`
      ),
      '',
      '--------------------------------',
      `TOTAL: $${total.toFixed(2)}`,
      '================================',
      '',
      'Thank you for your order!',
      ''
    ];
    return lines.join('\n');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
        {/* Header with close button */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Receipt</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none w-8 h-8 flex items-center justify-center"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Receipt Content */}
        <div ref={receiptRef} className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold mb-2">BOBA POS SYSTEM</h3>
            <div className="border-t-2 border-b-2 border-gray-300 py-2 my-2">
              <p className="text-lg font-semibold">Order #{orderNumber}</p>
            </div>
            <p className="text-sm text-gray-600">
              {new Date(timestamp).toLocaleString()}
            </p>
          </div>

          {/* Items List */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3 text-sm border-b border-gray-300 pb-2">
              ITEMS
            </h4>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between items-start text-sm">
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-gray-600 text-xs">
                      {item.quantity} × ${item.price.toFixed(2)}
                    </div>
                  </div>
                  <div className="font-semibold ml-4">
                    ${(item.quantity * item.price).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border-t-2 border-gray-300 pt-3 mb-6">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>TOTAL</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-600 border-t border-gray-200 pt-4">
            <p>Thank you for your order!</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex gap-3">
          <Button onClick={handleDownload} className="flex-1">
            Download Receipt
          </Button>
          <Button onClick={onClose} className="flex-1 bg-gray-500 hover:bg-gray-600">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Receipt;