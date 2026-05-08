// utils/FileHelper.js
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import xlsx from 'xlsx';
import { parseStringPromise } from 'xml2js';

/**
 * Reads JSON file
 */
export function readJSON(filePath) {
  const absolutePath = path.resolve(filePath);
  const rawData = fs.readFileSync(absolutePath, 'utf-8');
  return JSON.parse(rawData);
}

/**
 * Reads CSV file
 */
export function readCSV(filePath) {
  const absolutePath = path.resolve(filePath);
  const rawData = fs.readFileSync(absolutePath, 'utf-8');
  return parse(rawData, { columns: true, skip_empty_lines: true });
}

/**
 * Reads XLSX file
 */
export function readXLSX(filePath, sheetName) {
  const absolutePath = path.resolve(filePath);
  const workbook = xlsx.readFile(absolutePath);
  const sheet = workbook.Sheets[sheetName || workbook.SheetNames[0]];
  return xlsx.utils.sheet_to_json(sheet);
}

/**
 * Reads XML file and returns array of objects
 * Expected format:
 * <users>
 *   <user username="ajay1" password="pass1"/>
 *   ...
 * </users>
 */
export async function readXML(filePath) {
  const absolutePath = path.resolve(filePath);
  const rawData = fs.readFileSync(absolutePath, 'utf-8');
  const result = await parseStringPromise(rawData, { explicitArray: false });
  // Normalize into array of { username, password }
  return result;
  // return result.users.user.map(u => ({
  //   username: u.$.username,
  //   password: u.$.password
  // }));
}

/**
 * Reads XML file and returns array of objects
 * Each <element> becomes an object with its attributes
 * Example:
 * <users>
 *   <user username="ajay1" password="pass1"/>
 *   <user username="ajay2" password="pass2"/>
 * </users>
 *
 * => [ { username: "ajay1", password: "pass1" }, { username: "ajay2", password: "pass2" } ]
 */
export async function readXMLGeneric(filePath, rootTag = 'users', childTag = 'user') {
  const absolutePath = path.resolve(filePath);
  const rawData = fs.readFileSync(absolutePath, 'utf-8');
  const result = await parseStringPromise(rawData, { explicitArray: false });

  // Navigate to the specified root and child
  const children = result[rootTag][childTag];
  if (!children) {
    throw new Error(`XML structure does not contain <${rootTag}>/<${childTag}>`);
  }

  // Normalize: if single child, wrap in array
  const arr = Array.isArray(children) ? children : [children];

  // Map attributes ($) into plain objects
  return arr.map(el => el.$);
}

/**
 * Generic loader that auto-detects file type
 * @param {string} filePath - path to file
 * @param {object} options - optional params
 *   sheetName: for XLSX
 *   rootTag, childTag: for XML
 */
export async function getTestData(filePath, options = {}) {
  const { sheetName, rootTag, childTag } = options;
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case '.json':
      return readJSON(filePath);
    case '.csv':
      return readCSV(filePath);
    case '.xlsx':
      return readXLSX(filePath, sheetName);
    case '.xml':
      return await readXML(filePath, rootTag, childTag);
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}



export function getJsonData(filename, testId) {
  try {
    // Build file path dynamically
    const filepath = join(__dirname, `../testdata/${filename}.json`);
    // Load JSON file
    const testdata = require(filepath);
    const data = testdata[testId];
    if (!data) {
      throw new Error(`Test data not found for ${testId} in ${filename}.json`);
    }
    return data;
  } catch (error) {
    throw new Error(`Error loading test data file: ${filename}.json\n${error.message}`);
  }

}

