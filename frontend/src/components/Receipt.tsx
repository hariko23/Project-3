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
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto border border-border">
        {/* Header with close button */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-semibold text-foreground">Receipt</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-2xl leading-none w-8 h-8 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Receipt Content */}
        <div ref={receiptRef} className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold mb-2 text-foreground">BOBA POS SYSTEM</h3>
            <div className="border-t-2 border-b-2 border-border py-2 my-2">
              <p className="text-lg font-semibold text-foreground">Order #{orderNumber}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {new Date(timestamp).toLocaleString()}
            </p>
          </div>

          {/* Items List */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3 text-sm border-b border-border pb-2 text-foreground">
              ITEMS
            </h4>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between items-start text-sm">
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{item.name}</div>
                    <div className="text-muted-foreground text-xs">
                      {item.quantity} × ${item.price.toFixed(2)}
                    </div>
                  </div>
                  <div className="font-semibold ml-4 text-foreground">
                    ${(item.quantity * item.price).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border-t-2 border-border pt-3 mb-6">
            <div className="flex justify-between items-center text-lg font-bold text-foreground">
              <span>TOTAL</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground border-t border-border pt-4">
            <p>Thank you for your order!</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-card border-t border-border p-4 flex gap-3 z-10">
          <Button onClick={handleDownload} className="flex-1">
            Download Receipt
          </Button>
          <Button onClick={onClose} className="flex-1" variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Receipt;
// TEST