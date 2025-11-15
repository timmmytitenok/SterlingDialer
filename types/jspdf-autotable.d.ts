declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';

  interface UserOptions {
    head?: any[][];
    body?: any[][];
    startY?: number;
    theme?: 'striped' | 'grid' | 'plain';
    headStyles?: any;
    bodyStyles?: any;
    alternateRowStyles?: any;
    columnStyles?: any;
    margin?: any;
  }

  export default function autoTable(
    doc: jsPDF,
    options: UserOptions
  ): void;
}

