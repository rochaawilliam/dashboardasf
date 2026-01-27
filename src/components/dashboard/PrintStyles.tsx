export function PrintStyles() {
  return (
    <style>{`
      @media print {
        @page {
          size: A4 portrait;
          margin: 1cm;
        }
        
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          background: white !important;
        }
        
        .print\\:hidden {
          display: none !important;
        }
        
        .print\\:break-inside-avoid {
          break-inside: avoid;
        }
        
        .print\\:break-before-page {
          break-before: page;
        }
        
        .metric-card {
          break-inside: avoid;
          page-break-inside: avoid;
          box-shadow: none !important;
          border: 1px solid #e5e7eb !important;
        }
        
        .progress-bar,
        .progress-fill {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        /* Ensure charts print correctly */
        .recharts-wrapper {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        /* Header styling for print */
        header {
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 1rem;
          margin-bottom: 1rem;
        }
        
        /* Section headers */
        section {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        
        /* Grid adjustments for print */
        .dashboard-grid {
          grid-template-columns: repeat(2, 1fr) !important;
        }
      }
    `}</style>
  );
}
