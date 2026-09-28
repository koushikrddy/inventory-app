import React, { useState, useEffect } from 'react';
import { Check, Printer, X } from 'lucide-react';
import { formatCurrencyRaw } from '../utils/format';

interface ReceiptProps {
  sale: {
    invoice_number: string;
    total: number;
    items: { name: string; quantity: number; unit_price: number; total_price: number }[];
    payment_method: string;
    date: string;
  };
  onClose: () => void;
}

const ReceiptPrinter: React.FC<ReceiptProps> = ({ sale, onClose }) => {
  const [phase, setPhase] = useState<'idle' | 'feeding' | 'printing' | 'cutting' | 'done'>('idle');
  const [visibleItems, setVisibleItems] = useState(0);

  useEffect(() => {
    // Start feeding paper
    const t1 = setTimeout(() => setPhase('feeding'), 200);
    // Start printing
    const t2 = setTimeout(() => setPhase('printing'), 1200);
    // Print items progressively
    const t3 = setTimeout(() => setVisibleItems(sale.items.length), 1200 + sale.items.length * 200);
    // Start cutting
    const t4 = setTimeout(() => setPhase('cutting'), 1200 + sale.items.length * 200 + 500);
    // Done
    const t5 = setTimeout(() => setPhase('done'), 1200 + sale.items.length * 200 + 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [sale.items.length]);

  // Progressive item reveal
  useEffect(() => {
    if (phase !== 'printing') return;
    sale.items.forEach((_, i) => {
      setTimeout(() => {
        setVisibleItems(prev => Math.max(prev, i + 1));
      }, i * 200);
    });
  }, [phase, sale.items.length]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="flex gap-6 items-start" onClick={(e) => e.stopPropagation()}>
        {/* Printer Body */}
        <div className="relative">
          {/* Printer housing */}
          <div className="w-80 rounded-t-2xl p-4 pb-2" style={{
            background: 'linear-gradient(180deg, #2a2a3e, #1a1a2e)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderBottom: 'none',
          }}>
            {/* Printer top */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${phase === 'printing' ? 'bg-green-400 animate-pulse' : phase === 'done' ? 'bg-green-400' : 'bg-gray-600'}`} />
                <span className="text-[11px] text-gray-400 font-medium">
                  {phase === 'idle' && 'Ready'}
                  {phase === 'feeding' && 'Feeding paper...'}
                  {phase === 'printing' && 'Printing...'}
                  {phase === 'cutting' && 'Cutting receipt...'}
                  {phase === 'done' && 'Print complete'}
                </span>
              </div>
              <Printer size={16} className="text-gray-500" />
            </div>

            {/* Paper slot */}
            <div className="h-1 rounded-full" style={{
              background: 'linear-gradient(90deg, rgba(0,0,0,0.8), rgba(0,0,0,0.6), rgba(0,0,0,0.8))',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
            }} />
          </div>

          {/* Paper feeding out */}
          {(phase === 'feeding' || phase === 'printing' || phase === 'cutting' || phase === 'done') && (
            <div className="relative mx-auto" style={{
              width: '260px',
              animation: phase === 'feeding' ? 'paperFeed 1s ease-out forwards' : undefined,
            }}>
              {/* Receipt Paper */}
              <div className="bg-white rounded-b-lg shadow-2xl overflow-hidden" style={{
                borderTopLeftRadius: '0',
                borderTopRightRadius: '0',
                animation: phase === 'printing' ? 'paperGrow 0.5s ease-out forwards' : undefined,
              }}>
                <div className="px-5 py-4" style={{ fontFamily: "'Courier New', monospace" }}>
                  {/* Header */}
                  <div className="text-center mb-3">
                    <div className="text-[18px] font-bold text-gray-900 tracking-tight">InventoryPro</div>
                    <div className="text-[10px] text-gray-500">Smart Inventory Management</div>
                    <div className="text-[9px] text-gray-400 mt-0.5">━━━━━━━━━━━━━━━━━━━━━━</div>
                  </div>

                  {/* Invoice info */}
                  <div className="text-[10px] text-gray-600 mb-2 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Invoice:</span>
                      <span className="font-bold">{sale.invoice_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{sale.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment:</span>
                      <span className="uppercase">{sale.payment_method}</span>
                    </div>
                  </div>

                  <div className="text-[9px] text-gray-400">━━━━━━━━━━━━━━━━━━━━━━</div>

                  {/* Items */}
                  <div className="my-2 space-y-1.5">
                    {sale.items.slice(0, visibleItems).map((item, i) => (
                      <div key={i} className="text-[10px] text-gray-800" style={{
                        animation: `receiptLine 0.3s ease-out ${i * 0.2}s both`,
                      }}>
                        <div className="flex justify-between">
                          <span className="font-semibold">{item.name}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>{item.quantity} × {formatCurrencyRaw(item.unit_price)}</span>
                          <span className="font-bold">{formatCurrencyRaw(item.total_price)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-[9px] text-gray-400">━━━━━━━━━━━━━━━━━━━━━━</div>

                  {/* Total */}
                  <div className="flex justify-between text-[14px] font-bold text-gray-900 mt-2">
                    <span>TOTAL</span>
                    <span>{formatCurrencyRaw(sale.total)}</span>
                  </div>

                  <div className="text-[9px] text-gray-400 mt-2">━━━━━━━━━━━━━━━━━━━━━━</div>

                  {/* Barcode (simulated) */}
                  <div className="mt-3 text-center">
                    <div className="flex items-center justify-center gap-[1px] h-8 mx-auto" style={{ width: '160px' }}>
                      {Array.from({ length: 40 }).map((_, i) => (
                        <div key={i} className="bg-gray-800" style={{
                          width: Math.random() > 0.5 ? '2px' : '1px',
                          height: '100%',
                          opacity: 0.7 + Math.random() * 0.3,
                        }} />
                      ))}
                    </div>
                    <p className="text-[8px] text-gray-400 mt-1">{sale.invoice_number}</p>
                  </div>

                  {/* Footer */}
                  <div className="text-center mt-3 text-[9px] text-gray-400">
                    <p>Thank you for your purchase!</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Check size={10} className="text-green-500" />
                      <span className="text-green-600 font-bold">PAID</span>
                    </div>
                  </div>
                </div>

                {/* Cutting animation */}
                {phase === 'cutting' && (
                  <div className="relative">
                    <div className="h-px bg-red-500/60" style={{
                      animation: 'paperCut 0.8s ease-in-out',
                      boxShadow: '0 0 8px rgba(239,68,68,0.5)',
                    }} />
                  </div>
                )}

                {/* Zigzag bottom edge */}
                {phase === 'done' && (
                  <div className="relative h-3 overflow-hidden">
                    <svg viewBox="0 0 260 12" className="w-full" preserveAspectRatio="none">
                      <path d="M0,0 L5,12 L10,0 L15,12 L20,0 L25,12 L30,0 L35,12 L40,0 L45,12 L50,0 L55,12 L60,0 L65,12 L70,0 L75,12 L80,0 L85,12 L90,0 L95,12 L100,0 L105,12 L110,0 L115,12 L120,0 L125,12 L130,0 L135,12 L140,0 L145,12 L150,0 L155,12 L160,0 L165,12 L170,0 L175,12 L180,0 L185,12 L190,0 L195,12 L200,0 L205,12 L210,0 L215,12 L220,0 L225,12 L230,0 L235,12 L240,0 L245,12 L250,0 L255,12 L260,0" fill="white" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Success message */}
        {phase === 'done' && (
          <div className="mt-20 animate-slide-up">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: '0 4px 20px rgba(16,185,129,0.4)',
              }}>
                <Check size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Sale Complete!</h3>
                <p className="text-sm text-gray-400">Invoice: {sale.invoice_number}</p>
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-4">Receipt printed successfully</p>
            <button onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
              }}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptPrinter;
