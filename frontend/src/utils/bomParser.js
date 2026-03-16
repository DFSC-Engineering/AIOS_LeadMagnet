import * as XLSX from 'xlsx'
import Papa from 'papaparse'

/**
 * Parse Excel or CSV file and extract BOM data
 */
export async function parseBomFile(file) {
  const fileExtension = file.name.split('.').pop().toLowerCase()
  
  if (fileExtension === 'csv') {
    return parseCSV(file)
  } else if (['xlsx', 'xls'].includes(fileExtension)) {
    return parseExcel(file)
  } else {
    throw new Error('Unsupported file format. Please upload Excel (.xlsx, .xls) or CSV (.csv) files.')
  }
}

/**
 * Parse CSV file using Papa Parse
 */
function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error('CSV parsing error: ' + results.errors[0].message))
        } else {
          resolve({
            data: results.data,
            columns: results.meta.fields,
            rowCount: results.data.length
          })
        }
      },
      error: (error) => {
        reject(new Error('CSV parsing failed: ' + error.message))
      }
    })
  })
}

/**
 * Parse Excel file using SheetJS
 */
function parseExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
        
        if (jsonData.length === 0) {
          reject(new Error('Excel file is empty or has no data'))
          return
        }
        
        // Extract column names
        const columns = Object.keys(jsonData[0])
        
        resolve({
          data: jsonData,
          columns: columns,
          rowCount: jsonData.length,
          sheetName: sheetName
        })
      } catch (error) {
        reject(new Error('Excel parsing failed: ' + error.message))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Auto-detect column mapping based on common column names
 */
export function autoDetectColumns(columns) {
  const mapping = {
    partNumber: null,
    description: null,
    quantity: null,
    supplier: null,
    leadTime: null,
    unitPrice: null,
    annualVolume: null,
    lifecycleStatus: null,
    category: null,
    lastChangeDate: null
  }
  
  // Common column name patterns
  const patterns = {
    partNumber: [
      'part number', 'part#', 'part_number', 'partnumber', 'teilenummer',
      'item', 'item number', 'material', 'material number', 'artikelnummer'
    ],
    description: [
      'description', 'desc', 'name', 'bezeichnung', 'title',
      'part name', 'item name', 'product name'
    ],
    quantity: [
      'quantity', 'qty', 'menge', 'amount', 'q',
      'qty per unit', 'quantity per unit', 'stück'
    ],
    supplier: [
      'supplier', 'vendor', 'lieferant', 'manufacturer', 'hersteller',
      'source', 'supplier name'
    ],
    leadTime: [
      'lead time', 'leadtime', 'lt', 'lieferzeit', 'delivery time',
      'lead_time', 'lead-time', 'lt (weeks)', 'lt weeks'
    ],
    unitPrice: [
      'unit price', 'price', 'preis', 'cost', 'kosten',
      'unit cost', 'piece price', 'stückpreis'
    ],
    annualVolume: [
      'annual volume', 'yearly volume', 'jahresvolumen', 'volume',
      'annual qty', 'yearly qty', 'annual usage'
    ],
    lifecycleStatus: [
      'lifecycle', 'status', 'lifecycle status', 'lc status',
      'active', 'eol', 'obsolete', 'lebenszyklus'
    ],
    category: [
      'category', 'type', 'kategorie', 'group', 'gruppe',
      'part type', 'item type', 'classification'
    ],
    lastChangeDate: [
      'last change', 'last modified', 'änderungsdatum', 'modified date',
      'change date', 'last change date', 'last_change'
    ]
  }
  
  // Try to match each column
  columns.forEach(column => {
    const normalized = column.toLowerCase().trim()
    
    for (const [field, patternList] of Object.entries(patterns)) {
      if (mapping[field] === null) {
        for (const pattern of patternList) {
          if (normalized === pattern || normalized.includes(pattern)) {
            mapping[field] = column
            break
          }
        }
      }
    }
  })
  
  return mapping
}

/**
 * Validate BOM data structure
 */
export function validateBomData(data, mapping) {
  const errors = []
  
  // Check required fields
  if (!mapping.partNumber) {
    errors.push('Part Number column is required but not mapped')
  }
  if (!mapping.description) {
    errors.push('Description column is required but not mapped')
  }
  if (!mapping.quantity) {
    errors.push('Quantity column is required but not mapped')
  }
  
  // Check data quality
  const emptyPartNumbers = data.filter(row => !row[mapping.partNumber] || row[mapping.partNumber].toString().trim() === '')
  if (emptyPartNumbers.length > 0) {
    errors.push(`${emptyPartNumbers.length} rows have empty Part Numbers`)
  }
  
  // Check for duplicate part numbers
  const partNumbers = data.map(row => row[mapping.partNumber]).filter(Boolean)
  const duplicates = partNumbers.filter((item, index) => partNumbers.indexOf(item) !== index)
  if (duplicates.length > 0) {
    errors.push(`Found ${duplicates.length} duplicate Part Numbers`)
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    warnings: [],
    stats: {
      totalRows: data.length,
      validRows: data.length - emptyPartNumbers.length,
      duplicates: duplicates.length
    }
  }
}

/**
 * Transform raw data to standardized BOM format
 */
export function transformBomData(rawData, mapping) {
  return rawData.map((row, index) => {
    // Helper to safely get value
    const getValue = (field) => {
      const colName = mapping[field]
      if (!colName) return null
      const value = row[colName]
      if (value === undefined || value === null || value === '') return null
      return value
    }
    
    // Helper to parse number
    const getNumber = (field) => {
      const value = getValue(field)
      if (!value) return null
      const parsed = parseFloat(value.toString().replace(/[^\d.-]/g, ''))
      return isNaN(parsed) ? null : parsed
    }
    
    return {
      id: index + 1,
      partNumber: getValue('partNumber')?.toString().trim() || '',
      description: getValue('description')?.toString().trim() || '',
      quantity: getNumber('quantity') || 1,
      supplier: getValue('supplier')?.toString().trim() || 'Unknown',
      leadTime: getNumber('leadTime') || null,
      unitPrice: getNumber('unitPrice') || null,
      annualVolume: getNumber('annualVolume') || null,
      lifecycleStatus: getValue('lifecycleStatus')?.toString().trim() || 'Unknown',
      category: getValue('category')?.toString().trim() || 'Uncategorized',
      lastChangeDate: getValue('lastChangeDate') || null,
      
      // Calculated fields
      annualValue: null, // Will be calculated if unitPrice and annualVolume available
      supplierCount: 1,  // Default to single source (can be enriched later)
      changeFrequency: null // Can be calculated if historical data available
    }
  })
}

/**
 * Enrich BOM data with calculated fields
 */
export function enrichBomData(bomData) {
  return bomData.map(item => {
    // Calculate annual value
    if (item.unitPrice && item.annualVolume) {
      item.annualValue = item.unitPrice * item.annualVolume
    }
    
    // Normalize lifecycle status
    const status = item.lifecycleStatus.toLowerCase()
    if (status.includes('eol') || status.includes('obsolete') || status.includes('discontinued')) {
      item.lifecycleStatus = 'EOL'
    } else if (status.includes('nrnd') || status.includes('not recommended')) {
      item.lifecycleStatus = 'NRND'
    } else if (status.includes('active') || status.includes('production')) {
      item.lifecycleStatus = 'Active'
    } else {
      item.lifecycleStatus = 'Unknown'
    }
    
    return item
  })
}

/**
 * Get BOM statistics
 */
export function getBomStatistics(bomData) {
  const totalParts = bomData.length
  const uniqueSuppliers = new Set(bomData.map(item => item.supplier)).size
  const categoriesCount = new Set(bomData.map(item => item.category)).size
  
  const partsWithPrice = bomData.filter(item => item.unitPrice).length
  const partsWithLeadTime = bomData.filter(item => item.leadTime).length
  const partsWithVolume = bomData.filter(item => item.annualVolume).length
  
  const totalValue = bomData
    .filter(item => item.annualValue)
    .reduce((sum, item) => sum + item.annualValue, 0)
  
  const avgLeadTime = bomData
    .filter(item => item.leadTime)
    .reduce((sum, item) => sum + item.leadTime, 0) / (partsWithLeadTime || 1)
  
  return {
    totalParts,
    uniqueSuppliers,
    categoriesCount,
    completeness: {
      withPrice: partsWithPrice,
      withLeadTime: partsWithLeadTime,
      withVolume: partsWithVolume,
      completeData: bomData.filter(item => 
        item.unitPrice && item.leadTime && item.annualVolume
      ).length
    },
    totalValue: totalValue || null,
    avgLeadTime: avgLeadTime || null
  }
}
