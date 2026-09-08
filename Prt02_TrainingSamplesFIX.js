// ====================================================================
// Prt02_TrainingSamples.js
// TUGAS B - TRAINING SAMPLE AWAL
// AOI: KABUPATEN LUWU TIMUR
//
// 4 KELAS x 10 TITIK = 40 TRAINING SAMPLE
//
// Kelas:
// 1 = Air
// 2 = Vegetasi
// 3 = Permukiman
// 4 = Lahan Terbuka
// ====================================================================


// ====================================================================
// 1. AOI KABUPATEN LUWU TIMUR
// ====================================================================

var batas_lutim = ee.FeatureCollection(
  'FAO/GAUL/2015/level2'
)
.filter(ee.Filter.eq('ADM0_NAME', 'Indonesia'))
.filter(ee.Filter.eq('ADM2_NAME', 'Luwu Timur'));

var aoi = batas_lutim.geometry();

print('AOI:', batas_lutim);
print('Luas AOI (ha):', aoi.area().divide(10000));

Map.centerObject(aoi, 9);

// ====================================================================
// T1 - LANDSAT 8
// PERIODE T1: 2017-2018
// ====================================================================

var tanggalMulaiT1 = '2017-01-01';
var tanggalAkhirT1 = '2018-12-31';

var landsat8_T1 = ee.ImageCollection(
  'LANDSAT/LC08/C02/T1_L2'
)
.filterBounds(aoi)
.filterDate(tanggalMulaiT1, tanggalAkhirT1)
.filter(ee.Filter.lt('CLOUD_COVER', 30));


// Jumlah scene T1
var jumlahSceneT1 = landsat8_T1.size();

print(
  'Jumlah scene Landsat 8 T1:',
  jumlahSceneT1
);


// Rata-rata cloud cover T1
var rataCloudT1 = landsat8_T1
  .aggregate_mean('CLOUD_COVER');

print(
  'Rata-rata Cloud Cover T1 (%):',
  rataCloudT1
);


// Masking awan Landsat 8
function maskLandsat8(image) {

  var qa = image.select('QA_PIXEL');

  var mask = qa.bitwiseAnd(1 << 1).eq(0)
    .and(qa.bitwiseAnd(1 << 3).eq(0))
    .and(qa.bitwiseAnd(1 << 4).eq(0));

  return image
    .updateMask(mask)
    .select(
      ['SR_B2', 'SR_B3', 'SR_B4',
       'SR_B5', 'SR_B6', 'SR_B7'],
      ['Blue', 'Green', 'Red',
       'NIR', 'SWIR1', 'SWIR2']
    )
    .multiply(0.0000275)
    .add(-0.2);
}


// Terapkan masking
var landsat8_clean_T1 = landsat8_T1.map(
  maskLandsat8
);


// Composite T1
var compositeT1 = landsat8_clean_T1
  .median()
  .clip(aoi);


// NDVI T1
var ndviT1 = compositeT1
  .normalizedDifference(['NIR', 'Red'])
  .rename('NDVI_T1');


// Rata-rata NDVI T1
var meanNDVI_T1 = ndviT1.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: aoi,
  scale: 30,
  maxPixels: 1e13
});

print(
  'Rata-rata NDVI T1:',
  meanNDVI_T1
);


// Tampilkan Composite T1
Map.addLayer(
  compositeT1,
  {
    bands: ['Red', 'Green', 'Blue'],
    min: 0.02,
    max: 0.30
  },
  'Composite T1 Landsat 8'
);


// Tampilkan NDVI T1
Map.addLayer(
  ndviT1,
  {
    min: -1,
    max: 1,
    palette: [
      'blue',
      'white',
      'green'
    ]
  },
  'NDVI T1'
);


// ====================================================================
// 2. LANDSAT 9 - COMPOSITE T2
// ====================================================================

// Periode T2
var tanggalMulai = '2022-01-01';
var tanggalAkhir = '2023-12-31';

// Landsat 9 Collection 2 Level 2
var landsat9 = ee.ImageCollection(
  'LANDSAT/LC09/C02/T1_L2'
)
.filterBounds(aoi)
.filterDate(tanggalMulai, tanggalAkhir)
.filter(ee.Filter.lt('CLOUD_COVER', 30));

print('Jumlah scene Landsat 9 T2:', landsat9.size());

var rataCloudT2 = landsat9
  .aggregate_mean('CLOUD_COVER');

print(
  'Rata-rata Cloud Cover T2 (%):',
  rataCloudT2
);


// ====================================================================
// 3. MASKING AWAN LANDSAT 9
// ====================================================================

function maskLandsat9(image) {

  var qa = image.select('QA_PIXEL');

  // Bit 1 = Dilated Cloud
  // Bit 3 = Cloud
  // Bit 4 = Cloud Shadow

  var mask = qa.bitwiseAnd(1 << 1).eq(0)
    .and(qa.bitwiseAnd(1 << 3).eq(0))
    .and(qa.bitwiseAnd(1 << 4).eq(0));

  return image
    .updateMask(mask)
    .select(
      ['SR_B2', 'SR_B3', 'SR_B4',
       'SR_B5', 'SR_B6', 'SR_B7'],
      ['Blue', 'Green', 'Red',
       'NIR', 'SWIR1', 'SWIR2']
    )
    .multiply(0.0000275)
    .add(-0.2);
}


// Terapkan masking
var landsat9_clean = landsat9.map(maskLandsat9);


// ====================================================================
// 4. MEMBUAT COMPOSITE T2
// ====================================================================

var compositeT2 = landsat9_clean
  .median()
  .clip(aoi);

print('Composite T2:', compositeT2);

// ====================================================================
// NDVI T2
// ====================================================================

var ndviT2 = compositeT2
  .normalizedDifference(['NIR', 'Red'])
  .rename('NDVI_T2');


// Rata-rata NDVI T2
var meanNDVI_T2 = ndviT2.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: aoi,
  scale: 30,
  maxPixels: 1e13
});

print(
  'Rata-rata NDVI T2:',
  meanNDVI_T2
);


// Tampilkan NDVI T2
Map.addLayer(
  ndviT2,
  {
    min: -1,
    max: 1,
    palette: [
      'blue',
      'white',
      'green'
    ]
  },
  'NDVI T2'
);


// ====================================================================
// 5. MENAMPILKAN COMPOSITE T2
// ====================================================================

// RGB Natural Color
var visRGB = {
  bands: ['Red', 'Green', 'Blue'],
  min: 0.02,
  max: 0.30
};

Map.addLayer(
  compositeT2,
  visRGB,
  'Composite T2 Landsat 9'
);


// False Color
var visFalseColor = {
  bands: ['NIR', 'Red', 'Green'],
  min: 0.02,
  max: 0.40
};

Map.addLayer(
  compositeT2,
  visFalseColor,
  'False Color T2'
);


// Batas AOI
Map.addLayer(
  batas_lutim.style({
    color: 'FF0000',
    fillColor: 'FF000020',
    width: 3
  }),
  {},
  'Batas Luwu Timur'
);


// ====================================================================
// 6. DYNAMIC WORLD SEBAGAI PANDUAN PEMILIHAN KELAS
// ====================================================================

var dynamicWorld = ee.ImageCollection(
  'GOOGLE/DYNAMICWORLD/V1'
)
.filterBounds(aoi)
.filterDate(tanggalMulai, tanggalAkhir)
.select('label');


// Kelas dominan menggunakan mode
var dwMode = dynamicWorld
  .mode()
  .clip(aoi);


// Tampilkan Dynamic World
Map.addLayer(
  dwMode,
  {
    min: 0,
    max: 8,
    palette: [
      '419BDF', // Water
      '397D49', // Trees
      '88B053', // Grass
      '7A87C6', // Flooded vegetation
      'E49635', // Crops
      'DFC35A', // Shrub and scrub
      'C4281B', // Built
      'A59B8F', // Bare
      'B39FE1'  // Snow and ice
    ]
  },
  'Dynamic World - Panduan'
);


// ====================================================================
// 7. MEMBENTUK KELAS TRAINING
// ====================================================================
//
// Dynamic World:
// 0 = Water
// 1 = Trees
// 2 = Grass
// 4 = Crops
// 5 = Shrub/Scrub
// 6 = Built
// 7 = Bare
//
// Kita sederhanakan menjadi 4 kelas:
// 1 = Air
// 2 = Vegetasi
// 3 = Permukiman
// 4 = Lahan Terbuka
// ====================================================================


// AIR
var kelasAir = dwMode.eq(0);


// VEGETASI
var kelasVegetasi = dwMode.eq(1)
  .or(dwMode.eq(2))
  .or(dwMode.eq(4))
  .or(dwMode.eq(5));


// PERMUKIMAN
var kelasPermukiman = dwMode.eq(6);


// LAHAN TERBUKA
var kelasLahanTerbuka = dwMode.eq(7);


// Gabungkan menjadi satu raster kelas
var kelasTraining = ee.Image(0)
  .where(kelasAir, 1)
  .where(kelasVegetasi, 2)
  .where(kelasPermukiman, 3)
  .where(kelasLahanTerbuka, 4)
  .rename('class');


// Mask area yang tidak termasuk 4 kelas
kelasTraining = kelasTraining
  .updateMask(kelasTraining.gt(0));


// ====================================================================
// 8. MEMBUAT 10 TITIK PER KELAS
// ====================================================================

var trainingSamples = kelasTraining.stratifiedSample({

  // 10 titik setiap kelas
  numPoints: 10,

  // Raster kelas
  classBand: 'class',

  // AOI
  region: aoi,

  // Resolusi
  scale: 10,

  // Memastikan 10 titik untuk setiap kelas
  classValues: [1, 2, 3, 4],
  classPoints: [10, 10, 10, 10],

  // Menyimpan koordinat titik
  geometries: true,

  // Seed agar hasil dapat direproduksi
  seed: 12345,

  // Menghindari batas pixel yang bermasalah
  dropNulls: true
});


// ====================================================================
// 9. MENAMBAHKAN NAMA KELAS
// ====================================================================

trainingSamples = trainingSamples.map(
  function(feature) {

    var kode = ee.Number(
      feature.get('class')
    );

    var namaKelas = ee.Algorithms.If(
      kode.eq(1),
      'Air',

      ee.Algorithms.If(
        kode.eq(2),
        'Vegetasi',

        ee.Algorithms.If(
          kode.eq(3),
          'Permukiman',

          'Lahan Terbuka'
        )
      )
    );

    return feature.set(
      'kelas',
      namaKelas
    );
  }
);


// ====================================================================
// 10. CEK JUMLAH TRAINING SAMPLE
// ====================================================================

print('========================================');
print('HASIL TRAINING SAMPLE');
print('========================================');

print(
  'TOTAL TRAINING SAMPLE:',
  trainingSamples.size()
);


// Jumlah masing-masing kelas

var jumlahAir = trainingSamples
  .filter(ee.Filter.eq('class', 1))
  .size();

var jumlahVegetasi = trainingSamples
  .filter(ee.Filter.eq('class', 2))
  .size();

var jumlahPermukiman = trainingSamples
  .filter(ee.Filter.eq('class', 3))
  .size();

var jumlahLahanTerbuka = trainingSamples
  .filter(ee.Filter.eq('class', 4))
  .size();


print('Jumlah titik AIR:', jumlahAir);
print('Jumlah titik VEGETASI:', jumlahVegetasi);
print('Jumlah titik PERMUKIMAN:', jumlahPermukiman);
print('Jumlah titik LAHAN TERBUKA:', jumlahLahanTerbuka);


// Tampilkan tabel training sample
print(
  'Tabel Training Sample:',
  trainingSamples
);


// ====================================================================
// 11. MENAMPILKAN TITIK TRAINING DI PETA
// ====================================================================

// AIR - biru
Map.addLayer(
  trainingSamples.filter(
    ee.Filter.eq('class', 1)
  ),
  {
    color: '0000FF'
  },
  'Training Sample - AIR'
);


// VEGETASI - hijau
Map.addLayer(
  trainingSamples.filter(
    ee.Filter.eq('class', 2)
  ),
  {
    color: '00FF00'
  },
  'Training Sample - VEGETASI'
);


// PERMUKIMAN - merah
Map.addLayer(
  trainingSamples.filter(
    ee.Filter.eq('class', 3)
  ),
  {
    color: 'FF0000'
  },
  'Training Sample - PERMUKIMAN'
);


// LAHAN TERBUKA - kuning
Map.addLayer(
  trainingSamples.filter(
    ee.Filter.eq('class', 4)
  ),
  {
    color: 'FFFF00'
  },
  'Training Sample - LAHAN TERBUKA'
);


// ====================================================================
// 12. MENAMPILKAN INFORMASI KOORDINAT
// ====================================================================

print(
  'Koordinat Training Sample:',
  trainingSamples
    .map(function(feature) {

      var koordinat = feature.geometry()
        .coordinates();

      return feature.set(
        'longitude',
        koordinat.get(0)
      ).set(
        'latitude',
        koordinat.get(1)
      );

    })
);


// ====================================================================
// 13. EXPORT TRAINING SAMPLE
// ====================================================================

Export.table.toDrive({

  collection: trainingSamples,

  description:
    'Prt02_TrainingSamples_LuwuTimur',

  fileNamePrefix:
    'Prt02_TrainingSamples_LuwuTimur',

  folder:
    'gee_scripts',

  fileFormat:
    'CSV'
});


// ====================================================================
// SELESAI
// ====================================================================

print('========================================');
print('SCRIPT SELESAI');
print('========================================');

print(
  'Target: 4 kelas x 10 titik = 40 titik'
);

print(
  'Kelas: Air, Vegetasi, Permukiman, Lahan Terbuka'
);

print(
  'AOI: Kabupaten Luwu Timur'
);

print(
  'T2: Landsat 9 tahun 2022-2023'
);

print(
  'Filter: Cloud Cover < 30%'
);

print('========================================');

// =====================================================
// CEK CLOUD COVER RATA-RATA SETIAP BULAN
// =====================================================

var semuaLandsat = landsat8_T1.merge(landsat9);

var bulan = ee.List.sequence(1, 12);

var cloudBulanan = ee.FeatureCollection(
  bulan.map(function(b) {

    var hasil = semuaLandsat
      .filter(ee.Filter.calendarRange(b, b, 'month'))
      .aggregate_mean('CLOUD_COVER');

    return ee.Feature(null, {
      'bulan': b,
      'rata_cloud': hasil
    });

  })
);

print('Cloud Cover Rata-rata per Bulan:', cloudBulanan);