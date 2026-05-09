const TDMS_TAG = "TDSm";
const TDMS_INDEX_TAG = "TDSh";

const TOC = {
  META_DATA: 1 << 1,
  NEW_OBJECT_LIST: 1 << 2,
  RAW_DATA: 1 << 3,
  INTERLEAVED_DATA: 1 << 5,
  BIG_ENDIAN: 1 << 6,
  DAQMX_RAW_DATA: 1 << 7,
};

const RAW_DATA_INDEX = {
  SAME_AS_PREVIOUS: 0x00000000,
  NO_RAW_DATA: 0xffffffff,
};

// Partial TDMS type map. Expand as you implement more.
const TDS_TYPES = {
  0x00: { name: "Void", size: 0 },
  0x01: { name: "I8", size: 1, getter: "getInt8" },
  0x02: { name: "I16", size: 2, getter: "getInt16" },
  0x03: { name: "I32", size: 4, getter: "getInt32" },
  0x04: { name: "I64", size: 8, getter: "getBigInt64" },
  0x05: { name: "U8", size: 1, getter: "getUint8" },
  0x06: { name: "U16", size: 2, getter: "getUint16" },
  0x07: { name: "U32", size: 4, getter: "getUint32" },
  0x08: { name: "U64", size: 8, getter: "getBigUint64" },

  0x09: { name: "SingleFloat", size: 4, getter: "getFloat32" },
  0x0A: { name: "DoubleFloat", size: 8, getter: "getFloat64" },
  0x0B: { name: "ExtendedFloat", size: null },

  0x19: { name: "SingleFloatWithUnit", size: 4, getter: "getFloat32" },
  0x1A: { name: "DoubleFloatWithUnit", size: 8, getter: "getFloat64" },
  0x1B: { name: "ExtendedFloatWithUnit", size: null },

  0x20: { name: "String", size: null },
  0x21: { name: "Boolean", size: 1, getter: "getUint8" },
  0x44: { name: "TimeStamp", size: 16 },

  0x08000c: { name: "ComplexSingleFloat", size: 8 },
  0x10000d: { name: "ComplexDoubleFloat", size: 16 },
};

class BinaryReader {
  constructor(buffer, offset = 0, littleEndian = true) {
    this.buffer = buffer;
    this.view = new DataView(buffer);
    this.offset = offset;
    this.littleEndian = littleEndian;
    this.decoder = new TextDecoder("utf-8");
  }

  remaining() {
    return this.buffer.byteLength - this.offset;
  }

  seek(offset) {
    this.offset = Number(offset);
  }

  skip(n) {
    this.offset += Number(n);
  }

  u8() {
    const v = this.view.getUint8(this.offset);
    this.offset += 1;
    return v;
  }

  i8() {
    const v = this.view.getInt8(this.offset);
    this.offset += 1;
    return v;
  }

  u16() {
    const v = this.view.getUint16(this.offset, this.littleEndian);
    this.offset += 2;
    return v;
  }

  i16() {
    const v = this.view.getInt16(this.offset, this.littleEndian);
    this.offset += 2;
    return v;
  }

  u32(forceLittleEndian = false) {
    const v = this.view.getUint32(
      this.offset,
      forceLittleEndian ? true : this.littleEndian
    );
    this.offset += 4;
    return v;
  }

  i32() {
    const v = this.view.getInt32(this.offset, this.littleEndian);
    this.offset += 4;
    return v;
  }

  u64() {
    const v = this.view.getBigUint64(this.offset, this.littleEndian);
    this.offset += 8;
    return v;
  }

  i64() {
    const v = this.view.getBigInt64(this.offset, this.littleEndian);
    this.offset += 8;
    return v;
  }

  f32() {
    const v = this.view.getFloat32(this.offset, this.littleEndian);
    this.offset += 4;
    return v;
  }

  f64() {
    const v = this.view.getFloat64(this.offset, this.littleEndian);
    this.offset += 8;
    return v;
  }

  bytes(n) {
    const start = this.offset;
    this.offset += Number(n);
    return new Uint8Array(this.buffer, start, Number(n));
  }

  fixedAscii(n) {
    return String.fromCharCode(...this.bytes(n));
  }

    tdmsString() {
    const start = this.offset;
    const length = this.u32();

    if (length > this.remaining()) {
        const previewBytes = [];
        const n = Math.min(16, this.remaining());
        for (let i = 0; i < n; i++) {
        previewBytes.push(
            this.view.getUint8(this.offset + i).toString(16).padStart(2, "0")
        );
        }

        throw new Error(
        `Invalid TDMS string length ${length} at offset ${start}; ` +
        `remaining=${this.remaining()}; nextBytes=${previewBytes.join(" ")}`
        );
    }

    const bytes = this.bytes(length);
    return this.decoder.decode(bytes).replace(/\0+$/, "");
    }
}

function parseLeadIn(reader, absoluteOffset) {
  const tag = reader.fixedAscii(4);

  if (tag !== TDMS_TAG && tag !== TDMS_INDEX_TAG) {
    throw new Error(`Invalid TDMS segment tag at ${absoluteOffset}: ${tag}`);
  }

  // NI documents ToC as always little-endian, even when the big-endian flag is set.
  const tocMask = reader.u32(true);
  const littleEndian = (tocMask & TOC.BIG_ENDIAN) === 0;
  reader.littleEndian = littleEndian;

  const version = reader.u32();
  const nextSegmentOffset = reader.u64();
  const rawDataOffset = reader.u64();

  const leadInLength = 28n;
  const nextSegmentAbsolute =
    nextSegmentOffset === 0xffffffffffffffffn
      ? null
      : BigInt(absoluteOffset) + leadInLength + nextSegmentOffset;

  const metadataStart = BigInt(absoluteOffset) + leadInLength;
  const rawDataStart = metadataStart + rawDataOffset;

  return {
    tag,
    tocMask,
    flags: decodeToc(tocMask),
    version,
    littleEndian,
    nextSegmentOffset,
    rawDataOffset,
    metadataStart,
    rawDataStart,
    nextSegmentAbsolute,
  };
}

function decodeToc(tocMask) {
  return {
    hasMetaData: Boolean(tocMask & TOC.META_DATA),
    hasNewObjectList: Boolean(tocMask & TOC.NEW_OBJECT_LIST),
    hasRawData: Boolean(tocMask & TOC.RAW_DATA),
    isInterleaved: Boolean(tocMask & TOC.INTERLEAVED_DATA),
    isBigEndian: Boolean(tocMask & TOC.BIG_ENDIAN),
    hasDaqmxRawData: Boolean(tocMask & TOC.DAQMX_RAW_DATA),
  };
}

function parseMetadata(reader, segment) {
  const objects = [];

  if (!segment.flags.hasMetaData || segment.rawDataOffset === 0n) {
    return objects;
  }

  const objectCount = reader.u32();

  if (objectCount > 100000) {
    throw new Error(
      `Suspicious object count ${objectCount} at metadata start ${segment.metadataStart}`
    );
  }

  for (let i = 0; i < objectCount; i++) {
    const objectStart = reader.offset;
    const path = reader.tdmsString();

    const rawDataIndex = parseRawDataIndex(
      reader,
      Number(segment.rawDataStart)
    );

    const propertyCountOffset = reader.offset;
    const propertyCount = reader.u32();

    if (propertyCount > 10000) {
      throw new Error(
        `Suspicious property count ${propertyCount} at offset ${propertyCountOffset} for object ${path}; objectStart=${objectStart}`
      );
    }

    const properties = {};

    for (let p = 0; p < propertyCount; p++) {
    const propertyOffset = reader.offset;

    let name = reader.tdmsString();
    let typeId = reader.u32();

    // Recovery for files where we appear to land 4 bytes early:
    //   00 00 00 00 | 0c 00 00 00 | "wf_increment" ...
    // The first 0 is not a real property name length; the next u32 is
    // actually the property-name length.
    if (
        name === "" &&
        typeId > 0 &&
        typeId < 512 &&
        looksLikeAsciiString(reader, reader.offset, typeId)
    ) {
        name = reader.decoder.decode(reader.bytes(typeId)).replace(/\0+$/, "");
        typeId = reader.u32();
    }

    try {
        properties[name] = parsePropertyValue(reader, typeId);
    } catch (error) {
        throw new Error(
        `Failed property "${name}" type=${typeId} / 0x${typeId.toString(16)} ` +
        `at propertyOffset=${propertyOffset} object=${path}: ${error.message}`
        );
    }
    }

    objects.push({
      path,
      kind: inferObjectKind(path),
      rawDataIndex,
      properties,
    });
  }

  return objects;
}
function parseRawDataIndex(reader, metadataEnd = null) {
  const indexStart = reader.offset;
  const marker = reader.u32();

  if (marker === RAW_DATA_INDEX.NO_RAW_DATA) {
    return { kind: "none" };
  }

  if (marker === RAW_DATA_INDEX.SAME_AS_PREVIOUS) {
    return { kind: "same-as-previous" };
  }

  const indexLength = marker;

  if (indexLength < 20) {
    throw new Error(
      `Invalid raw-data index length ${indexLength} at offset ${indexStart}`
    );
  }

  const typeId = reader.u32();
  const dimension = reader.u32();
  const valueCount = reader.u64();

  const typeInfo = TDS_TYPES[typeId] ?? {
    name: `Unknown(${typeId})`,
    size: null,
  };

  let totalSizeBytes = null;

  if (typeInfo.size === null) {
    totalSizeBytes = reader.u64();
  }

  const indexEnd = indexStart + indexLength;

  if (reader.offset < indexEnd) {
    reader.seek(indexEnd);
  }

  if (reader.offset > indexEnd) {
    throw new Error(
      `Raw-data index over-read at offset ${indexStart}: ` +
      `indexLength=${indexLength}, expectedEnd=${indexEnd}, actual=${reader.offset}`
    );
  }

  return {
    kind: "new",
    indexLength,
    typeId,
    typeName: typeInfo.name,
    dimension,
    valueCount: valueCount.toString(),
    totalSizeBytes: totalSizeBytes?.toString() ?? null,
    rawIndexStart: indexStart,
    rawIndexEnd: indexEnd,
  };
}

function scorePropertySectionStart(reader, offset, metadataEnd = null) {
  const end = metadataEnd ?? reader.buffer.byteLength;

  if (offset < 0 || offset + 4 > end) {
    return -Infinity;
  }

  let score = 0;
  const propertyCount = reader.view.getUint32(offset, reader.littleEndian);

  // Most TDMS objects have a small number of properties.
  if (propertyCount > 10000) {
    return -1000;
  }

  score += 10;

  if (propertyCount === 0) {
    return score + 5;
  }

  // If there is at least one property, the next field should be a TDMS string
  // length for the property name.
  if (offset + 8 > end) {
    return score - 20;
  }

  const nameLength = reader.view.getUint32(offset + 4, reader.littleEndian);
  const nameStart = offset + 8;
  const nameEnd = nameStart + nameLength;

  if (nameLength <= 0 || nameLength > 512 || nameEnd > end) {
    return score - 100;
  }

  score += 20;

  // Property names are usually readable ASCII-ish, e.g. wf_start_time,
  // wf_increment, unit_string, NI_ChannelName.
  let printable = 0;
  for (let i = nameStart; i < nameEnd; i++) {
    const b = reader.view.getUint8(i);
    if (
      (b >= 32 && b <= 126) ||
      b === 9 ||
      b === 10 ||
      b === 13
    ) {
      printable++;
    }
  }

  const ratio = printable / Math.max(1, nameLength);
  if (ratio > 0.8) {
    score += 20;
  } else {
    score -= 50;
  }

  return score;
}

function parsePropertyValue(reader, typeId) {
  switch (typeId) {
    case 0x01: return reader.i8();
    case 0x02: return reader.i16();
    case 0x03: return reader.i32();
    case 0x04: return reader.i64().toString();

    case 0x05: return reader.u8();
    case 0x06: return reader.u16();
    case 0x07: return reader.u32();
    case 0x08: return reader.u64().toString();

    case 0x09: return reader.f32();
    case 0x0A: return reader.f64();

    case 0x19: return reader.f32();
    case 0x1A: return reader.f64();

    case 0x20: return reader.tdmsString();

    case 0x21: return Boolean(reader.u8());

    case 0x44:
      return parseTdmsTimestamp(reader);

    default:
      throw new Error(
        `Unsupported property type ${typeId} / 0x${typeId.toString(16)} at offset ${reader.offset}`
      );
  }
}

function parseTdmsTimestamp(reader) {
  // NI stores timestamps as i64 seconds since 1904-01-01 UTC
  // plus u64 fractions of a second.
  const fractions = reader.u64();
  const seconds = reader.i64();

  const unixSeconds = Number(seconds - 2082844800n);
  const milliseconds = unixSeconds * 1000;

  return {
    tdmsSeconds: seconds.toString(),
    fractions: fractions.toString(),
    isoApprox: Number.isFinite(milliseconds)
      ? new Date(milliseconds).toISOString()
      : null,
  };
}

function inferObjectKind(path) {
  if (path === "/") return "file";

  const parts = splitTdmsPath(path);
  if (parts.length === 1) return "group";
  if (parts.length === 2) return "channel";
  return "unknown";
}

function splitTdmsPath(path) {
  if (path === "/") return [];

  const matches = [...path.matchAll(/'((?:''|[^'])*)'/g)];
  return matches.map(m => m[1].replaceAll("''", "'"));
}

export function parseTdms(buffer) {
  const reader = new BinaryReader(buffer);
  const segments = [];
  const objectMap = new Map();
  const warnings = [];

  let offset = 0;

  while (offset < buffer.byteLength) {
    reader.seek(offset);

    let segment;
    try {
      segment = parseLeadIn(reader, offset);
    } catch (error) {
      warnings.push(error.message);
      break;
    }

    let objects = [];
    if (segment.flags.hasMetaData) {
      try {
        reader.seek(Number(segment.metadataStart));
        objects = parseMetadata(reader, segment);

        attachRawDataRangesToObjects({
        objects,
        objectMap,
        segment,
        segmentIndex: segments.length,
        fileByteLength: buffer.byteLength,
        });

        for (const obj of objects) {
        const previous = objectMap.get(obj.path);
        const merged = mergeTdmsObject(previous, obj);
        objectMap.set(obj.path, merged);
        }
      } catch (error) {
        warnings.push(`Failed to parse metadata at segment ${segments.length}: ${error.message}`);
      }
    }

    segments.push({
      index: segments.length,
      offset,
      ...serializeBigInts(segment),
      objects,
    });

    if (segment.nextSegmentAbsolute === null) {
      break;
    }

    const next = Number(segment.nextSegmentAbsolute);
    if (!Number.isFinite(next) || next <= offset) {
      warnings.push(`Invalid next segment offset at segment ${segments.length - 1}`);
      break;
    }

    offset = next;
  }

  return {
    segments,
    objects: [...objectMap.values()],
    warnings,
  };
}

function mergeTdmsObject(previous, current) {
  if (!previous) {
    return current;
  }

  const rawDataIndex =
    current.rawDataIndex?.kind === "same-as-previous"
      ? previous.rawDataIndex
      : current.rawDataIndex;

  return {
    ...previous,
    ...current,
    rawDataIndex,
    properties: {
      ...(previous.properties ?? {}),
      ...(current.properties ?? {}),
    },
    rawDataSegments: [
      ...(previous.rawDataSegments ?? []),
      ...(current.rawDataSegments ?? []),
    ],
  };
}

function attachRawDataRangesToObjects({
  objects,
  objectMap,
  segment,
  segmentIndex,
  fileByteLength,
}) {
  if (!segment.flags.hasRawData) {
    return;
  }

  if (segment.flags.isInterleaved) {
    // Later feature. For now we only support contiguous, non-interleaved data.
    return;
  }

  let cursor = Number(segment.rawDataStart);
  const rawDataEnd =
    segment.nextSegmentAbsolute === null
      ? fileByteLength
      : Number(segment.nextSegmentAbsolute);

  for (const obj of objects) {
    if (obj.kind !== "channel") {
      continue;
    }

    const previous = objectMap.get(obj.path);

    const effectiveRawIndex =
      obj.rawDataIndex?.kind === "same-as-previous"
        ? previous?.rawDataIndex
        : obj.rawDataIndex;

    if (!effectiveRawIndex || effectiveRawIndex.kind !== "new") {
      continue;
    }

    const typeSize = getTypeSize(effectiveRawIndex.typeId);

    if (typeSize === null) {
      continue;
    }

    const valueCount = Number(effectiveRawIndex.valueCount);
    const byteLength = valueCount * typeSize;

    if (!Number.isFinite(byteLength) || byteLength <= 0) {
      continue;
    }

    if (cursor + byteLength > rawDataEnd) {
      // Do not throw yet; just skip range assignment for this object.
      // Later we can make this a parser warning.
      continue;
    }

    obj.rawDataIndex =
      obj.rawDataIndex?.kind === "same-as-previous"
        ? effectiveRawIndex
        : obj.rawDataIndex;

    obj.rawDataSegments = [
    {
        segmentIndex,
        byteOffset: cursor,
        byteLength,
        valueCount: String(valueCount),
        typeId: effectiveRawIndex.typeId,
        typeName: effectiveRawIndex.typeName,
        littleEndian: segment.littleEndian,
    },
    ];

    cursor += byteLength;
  }
}

function getTypeSize(typeId) {
  const typeInfo = TDS_TYPES[typeId];
  return typeInfo?.size ?? null;
}

function serializeBigInts(obj) {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    out[key] = typeof value === "bigint" ? value.toString() : value;
  }
  return out;
}

export function readChannelPreview(buffer, channelObject, limit = 20) {
  if (!channelObject.rawDataSegments?.length) {
    throw new Error("No raw-data segments available for this channel.");
  }

  const segment = channelObject.rawDataSegments[0];
  const view = new DataView(buffer);

  const typeId = segment.typeId;
  const littleEndian = segment.littleEndian !== false;
  const maxValues = Math.min(Number(segment.valueCount), limit);

  const values = [];

  for (let i = 0; i < maxValues; i++) {
    const offset = segment.byteOffset + i * getTypeSize(typeId);
    values.push(readNumericValue(view, offset, typeId, littleEndian));
  }

  const wfIncrement = channelObject.properties?.wf_increment ?? null;

  const rows = values.map((value, i) => ({
    index: i,
    x: typeof wfIncrement === "number" ? i * wfIncrement : i,
    value,
  }));

  return {
    path: channelObject.path,
    typeName: segment.typeName,
    unit:
      channelObject.properties?.unit_string ??
      channelObject.properties?.NI_UnitDescription ??
      null,
    segmentIndex: segment.segmentIndex,
    byteOffset: segment.byteOffset,
    shownValues: rows.length,
    totalValuesInSegment: segment.valueCount,
    rows,
  };
}

function readNumericValue(view, offset, typeId, littleEndian) {
  switch (typeId) {
    case 0x01: return view.getInt8(offset);
    case 0x02: return view.getInt16(offset, littleEndian);
    case 0x03: return view.getInt32(offset, littleEndian);
    case 0x04: return view.getBigInt64(offset, littleEndian).toString();

    case 0x05: return view.getUint8(offset);
    case 0x06: return view.getUint16(offset, littleEndian);
    case 0x07: return view.getUint32(offset, littleEndian);
    case 0x08: return view.getBigUint64(offset, littleEndian).toString();

    case 0x09: return view.getFloat32(offset, littleEndian);
    case 0x0A: return view.getFloat64(offset, littleEndian);

    case 0x19: return view.getFloat32(offset, littleEndian);
    case 0x1A: return view.getFloat64(offset, littleEndian);

    case 0x21: return Boolean(view.getUint8(offset));

    default:
      throw new Error(`Preview not supported for typeId ${typeId}`);
  }
}

export function readChannelSeries(buffer, channelObject, options = {}) {
  if (!channelObject.rawDataSegments?.length) {
    throw new Error("No raw-data segments available for this channel.");
  }

  const maxPoints = options.maxPoints ?? 10000;
  const view = new DataView(buffer);

  const wfIncrement = channelObject.properties?.wf_increment ?? null;
  const unit =
    channelObject.properties?.unit_string ??
    channelObject.properties?.NI_UnitDescription ??
    null;

  const allValues = [];

  for (const segment of channelObject.rawDataSegments) {
    const typeId = segment.typeId;
    const typeSize = getTypeSize(typeId);

    if (typeSize === null) {
      throw new Error(`Cannot plot variable-size typeId ${typeId}`);
    }

    const littleEndian = segment.littleEndian !== false;
    const valueCount = Number(segment.valueCount);

    for (let i = 0; i < valueCount; i++) {
      const offset = segment.byteOffset + i * typeSize;
      allValues.push(readNumericValue(view, offset, typeId, littleEndian));
    }
  }

  const totalValues = allValues.length;

  // Downsample for browser plotting if the channel is large.
  const step = Math.max(1, Math.ceil(totalValues / maxPoints));
  const x = [];
  const y = [];

  for (let i = 0; i < totalValues; i += step) {
    x.push(typeof wfIncrement === "number" ? i * wfIncrement : i);
    y.push(allValues[i]);
  }

  return {
    path: channelObject.path,
    name:
      channelObject.properties?.NI_ChannelName ??
      channelObject.path,
    unit,
    x,
    y,
    totalValues,
    plottedValues: y.length,
    downsampleStep: step,
    xLabel: typeof wfIncrement === "number" ? "Time (s)" : "Index",
    yLabel: unit ? `${channelObject.properties?.NI_ChannelName ?? "Value"} (${unit})` : "Value",
  };
}

export function getChannelStats(buffer, channelObject) {
  if (!channelObject.rawDataSegments?.length) {
    return {
      min: null,
      max: null,
      mean: null,
      count: 0,
    };
  }

  const view = new DataView(buffer);

  let count = 0;
  let sum = 0;
  let min = Infinity;
  let max = -Infinity;

  for (const segment of channelObject.rawDataSegments) {
    const typeId = segment.typeId;
    const typeSize = getTypeSize(typeId);

    if (typeSize === null) {
      return {
        min: null,
        max: null,
        mean: null,
        count: 0,
        unsupported: true,
      };
    }

    const littleEndian = segment.littleEndian !== false;
    const valueCount = Number(segment.valueCount);

    for (let i = 0; i < valueCount; i++) {
      const offset = segment.byteOffset + i * typeSize;
      const value = readNumericValue(view, offset, typeId, littleEndian);

      if (typeof value !== "number" || !Number.isFinite(value)) {
        continue;
      }

      count++;
      sum += value;
      if (value < min) min = value;
      if (value > max) max = value;
    }
  }

  if (count === 0) {
    return {
      min: null,
      max: null,
      mean: null,
      count: 0,
    };
  }

  return {
    min,
    max,
    mean: sum / count,
    count,
  };
}