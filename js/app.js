/* =========================================================
   KONFIGURASI DATABASE LOKAL (WEB STORAGE / LOCALSTORAGE)
   ========================================================= */
const KUNCI_DB = "sim_asrama_db_v1";
const KUNCI_TEMA = "sim_asrama_tema_v1";

// Data contoh awal (otomatis dimuat saat aplikasi pertama kali dibuka)
const dataAwal = {
    santri: [
        {
            id_santri: 1,
            nis: "2026001",
            nama: "Ahmad Fauzan",
            kamar: "Al-Farabi 01",
            kelas: "7A",
            status: "Di Asrama",
            poin: 100
        },
        {
            id_santri: 2,
            nis: "2026002",
            nama: "Muhammad Zidan",
            kamar: "Al-Farabi 01",
            kelas: "7B",
            status: "Sedang Izin",
            poin: 85
        },
        {
            id_santri: 3,
            nis: "2026003",
            nama: "Rizky Ramadhan",
            kamar: "Ibnu Sina 02",
            kelas: "7A",
            status: "Di Asrama",
            poin: 110
        },
        {
            id_santri: 4,
            nis: "2026004",
            nama: "Ilham Maulana",
            kamar: "Ibnu Sina 02",
            kelas: "7C",
            status: "Di Asrama",
            poin: 65
        }
    ],
    perizinan: [
        {
            id_izin: 1,
            id_santri: 2,
            jenis_izin: "Izin Keluar",
            keperluan: "Membeli perlengkapan kitab dan alat tulis",
            tgl_izin: "2026-11-20T13:30",
            estimasi_kembali: "2026-11-20T17:30",
            status_izin: "Aktif"
        },
        {
            id_izin: 2,
            id_santri: 1,
            jenis_izin: "Sakit",
            keperluan: "Periksa gigi ke klinik terdekat",
            tgl_izin: "2026-11-18T09:00",
            estimasi_kembali: "2026-11-18T12:00",
            status_izin: "Kembali"
        }
    ],
    riwayat_poin: [
        {
            id_poin: 1,
            id_santri: 2,
            kategori: "Pelanggaran",
            keterangan: "Terlambat mengikuti jamaah subuh",
            jumlah_poin: -15,
            tanggal: "2026-11-19T05:15"
        },
        {
            id_poin: 2,
            id_santri: 3,
            kategori: "Prestasi",
            keterangan: "Juara 1 lomba hafalan nadhom tingkat asrama",
            jumlah_poin: 10,
            tanggal: "2026-11-18T20:30"
        },
        {
            id_poin: 3,
            id_santri: 4,
            kategori: "Pelanggaran",
            keterangan: "Tidak melaksanakan piket kebersihan kamar",
            jumlah_poin: -35,
            tanggal: "2026-11-17T07:00"
        }
    ]
};

// Variabel penampung data aktif di memori
let db = muatDatabase();

/* =========================================================
   FUNGSI PENGELOLAAN DATABASE (CRUD LOCALSTORAGE)
   ========================================================= */
function muatDatabase() {
    const tersimpan = localStorage.getItem(KUNCI_DB);
    if (tersimpan) {
        return JSON.parse(tersimpan);
    }
    // Jika belum ada data, simpan data contoh awal
    const salinanAwal = JSON.parse(JSON.stringify(dataAwal));
    localStorage.setItem(KUNCI_DB, JSON.stringify(salinanAwal));
    return salinanAwal;
}

function simpanDatabase() {
    localStorage.setItem(KUNCI_DB, JSON.stringify(db));
}

function buatIdBaru(daftarItem, namaKolomId) {
    if (daftarItem.length === 0) return 1;
    let idTertinggi = 0;
    daftarItem.forEach(function (item) {
        if (item[namaKolomId] > idTertinggi) {
            idTertinggi = item[namaKolomId];
        }
    });
    return idTertinggi + 1;
}

function cariSantriById(idSantri) {
    return db.santri.find(function (s) {
        return s.id_santri === Number(idSantri);
    });
}

/* =========================================================
   FUNGSI BANTUAN TAMPILAN (FORMAT TANGGAL, JAM, & TOAST)
   ========================================================= */
function formatWaktu(stringWaktu) {
    if (!stringWaktu) return "-";
    const tanggal = new Date(stringWaktu);
    if (isNaN(tanggal.getTime())) return stringWaktu;

    return tanggal.toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function ambilWaktuSekarangISO() {
    const sekarang = new Date();
    const selisihMenit = sekarang.getTimezoneOffset();
    const waktuLokal = new Date(sekarang.getTime() - selisihMenit * 60000);
    return waktuLokal.toISOString().slice(0, 16);
}

function perbaruiJamNavbar() {
    const elemenJam = document.getElementById("jam-sekarang");
    const sekarang = new Date();
    elemenJam.textContent = sekarang.toLocaleString("id-ID", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}

let timerToast = null;
function tampilkanToast(pesan, tipe) {
    const toast = document.getElementById("toast-notifikasi");
    toast.textContent = pesan;
    toast.className = "toast show " + (tipe || "sukses");

    if (timerToast) clearTimeout(timerToast);
    timerToast = setTimeout(function () {
        toast.classList.remove("show");
    }, 3000);
}

/* =========================================================
   MANIPULASI DOM: STATISTIK, DROPDOWN, & TABEL DATA
   ========================================================= */
function renderSemua() {
    perbaruiStatistik();
    perbaruiDropdownKamar();
    perbaruiDropdownSantri();
    renderTabelSantri();
    renderTabelIzin();
    renderTabelPoin();
}

// 1. Update 4 Kartu Statistik di Bagian Atas
function perbaruiStatistik() {
    const totalSantri = db.santri.length;
    let jumlahDiAsrama = 0;
    let jumlahSedangIzin = 0;
    let jumlahPembinaan = 0;

    db.santri.forEach(function (s) {
        if (s.status === "Di Asrama") {
            jumlahDiAsrama++;
        } else if (s.status === "Sedang Izin") {
            jumlahSedangIzin++;
        }

        if (s.poin < 75) {
            jumlahPembinaan++;
        }
    });

    document.getElementById("stat-total").textContent = totalSantri;
    document.getElementById("stat-asrama").textContent = jumlahDiAsrama;
    document.getElementById("stat-izin").textContent = jumlahSedangIzin;
    document.getElementById("stat-pembinaan").textContent = jumlahPembinaan;
}

// 2. Isi Pilihan Filter Kamar Secara Dinamis
function perbaruiDropdownKamar() {
    const selectKamar = document.getElementById("filter-kamar");
    const pilihanSebelumnya = selectKamar.value;

    // Kumpulkan nama kamar unik
    const daftarKamar = [];
    db.santri.forEach(function (s) {
        if (!daftarKamar.includes(s.kamar)) {
            daftarKamar.push(s.kamar);
        }
    });
    daftarKamar.sort();

    selectKamar.innerHTML = '<option value="semua">Semua Kamar</option>';
    daftarKamar.forEach(function (namaKamar) {
        const option = document.createElement("option");
        option.value = namaKamar;
        option.textContent = namaKamar;
        selectKamar.appendChild(option);
    });

    if (daftarKamar.includes(pilihanSebelumnya)) {
        selectKamar.value = pilihanSebelumnya;
    }
}

// 3. Isi Pilihan Santri pada Form Modal Izin & Poin
function perbaruiDropdownSantri() {
    const selectIzin = document.getElementById("izin-id-santri");
    const selectPoin = document.getElementById("poin-id-santri");

    selectIzin.innerHTML = '<option value="">-- Pilih Santri --</option>';
    selectPoin.innerHTML = '<option value="">-- Pilih Santri --</option>';

    const santriUrut = [...db.santri].sort(function (a, b) {
        return a.nama.localeCompare(b.nama);
    });

    santriUrut.forEach(function (s) {
        const label = s.nama + " (" + s.nis + " - " + s.kamar + ")";

        const opt1 = document.createElement("option");
        opt1.value = s.id_santri;
        opt1.textContent = label;
        selectIzin.appendChild(opt1);

        const opt2 = document.createElement("option");
        opt2.value = s.id_santri;
        opt2.textContent = label + " [Poin: " + s.poin + "]";
        selectPoin.appendChild(opt2);
    });
}

// 4. Render Tabel Data Santri dengan Live Search & Filter
function renderTabelSantri() {
    const tbody = document.getElementById("tbody-santri");
    const kataKunci = document.getElementById("cari-santri").value.toLowerCase().trim();
    const filterKamar = document.getElementById("filter-kamar").value;
    const filterStatus = document.getElementById("filter-status").value;

    const hasilFilter = db.santri.filter(function (s) {
        const cocokTeks =
            s.nama.toLowerCase().includes(kataKunci) ||
            s.nis.toLowerCase().includes(kataKunci);
        const cocokKamar = filterKamar === "semua" || s.kamar === filterKamar;
        const cocokStatus = filterStatus === "semua" || s.status === filterStatus;
        return cocokTeks && cocokKamar && cocokStatus;
    });

    tbody.innerHTML = "";

    if (hasilFilter.length === 0) {
        const trKosong = document.createElement("tr");
        trKosong.innerHTML = '<td colspan="8" class="teks-tengah">Tidak ada data santri yang sesuai.</td>';
        tbody.appendChild(trKosong);
        return;
    }

    hasilFilter.forEach(function (santri, indeks) {
        const tr = document.createElement("tr");

        // Tentukan warna badge status keberadaan
        const kelasStatus = santri.status === "Di Asrama" ? "badge-hijau" : "badge-kuning";

        // Tentukan warna badge skor poin secara kondisional
        let kelasPoin = "badge-hijau";
        if (santri.poin < 50) {
            kelasPoin = "badge-merah";
        } else if (santri.poin < 80) {
            kelasPoin = "badge-kuning";
        }

        tr.innerHTML =
            "<td>" + (indeks + 1) + "</td>" +
            "<td><strong>" + santri.nis + "</strong></td>" +
            "<td>" + santri.nama + "</td>" +
            "<td>" + santri.kamar + "</td>" +
            "<td>" + santri.kelas + "</td>" +
            '<td><span class="badge ' + kelasStatus + '">' + santri.status + "</span></td>" +
            '<td><span class="badge ' + kelasPoin + '">' + santri.poin + " Poin</span></td>" +
            '<td><div class="aksi-grup"></div></td>';

        // Buat tombol Edit dan Hapus secara dinamis lewat DOM
        const wadahAksi = tr.querySelector(".aksi-grup");

        const btnEdit = document.createElement("button");
        btnEdit.type = "button";
        btnEdit.className = "btn btn-kecil btn-peringatan";
        btnEdit.textContent = "Edit";
        btnEdit.addEventListener("click", function () {
            bukaModalEditSantri(santri.id_santri);
        });

        const btnHapus = document.createElement("button");
        btnHapus.type = "button";
        btnHapus.className = "btn btn-kecil btn-bahaya";
        btnHapus.textContent = "Hapus";
        btnHapus.addEventListener("click", function () {
            hapusSantri(santri.id_santri);
        });

        wadahAksi.appendChild(btnEdit);
        wadahAksi.appendChild(btnHapus);
        tbody.appendChild(tr);
    });
}

// 5. Render Tabel Log Perizinan
function renderTabelIzin() {
    const tbody = document.getElementById("tbody-izin");
    const kataKunci = document.getElementById("cari-izin").value.toLowerCase().trim();
    const filterStatus = document.getElementById("filter-status-izin").value;

    // Urutkan izin 'Aktif' di bagian paling atas
    const daftarUrut = [...db.perizinan].sort(function (a, b) {
        if (a.status_izin === b.status_izin) {
            return b.id_izin - a.id_izin;
        }
        return a.status_izin === "Aktif" ? -1 : 1;
    });

    const hasilFilter = daftarUrut.filter(function (izin) {
        const santri = cariSantriById(izin.id_santri);
        const namaSantri = santri ? santri.nama.toLowerCase() : "";
        const cocokTeks =
            namaSantri.includes(kataKunci) ||
            izin.keperluan.toLowerCase().includes(kataKunci);
        const cocokStatus = filterStatus === "semua" || izin.status_izin === filterStatus;
        return cocokTeks && cocokStatus;
    });

    tbody.innerHTML = "";

    if (hasilFilter.length === 0) {
        const trKosong = document.createElement("tr");
        trKosong.innerHTML = '<td colspan="8" class="teks-tengah">Belum ada riwayat perizinan yang sesuai.</td>';
        tbody.appendChild(trKosong);
        return;
    }

    hasilFilter.forEach(function (izin, indeks) {
        const santri = cariSantriById(izin.id_santri);
        const infoSantri = santri
            ? "<strong>" + santri.nama + "</strong><br><small>(" + santri.kamar + ")</small>"
            : "Santri Dihapus";

        const kelasStatus = izin.status_izin === "Aktif" ? "badge-kuning" : "badge-hijau";
        const labelStatus = izin.status_izin === "Aktif" ? "Masih di Luar" : "Sudah Kembali";

        const tr = document.createElement("tr");
        tr.innerHTML =
            "<td>" + (indeks + 1) + "</td>" +
            "<td>" + infoSantri + "</td>" +
            '<td><span class="badge badge-biru">' + izin.jenis_izin + "</span></td>" +
            "<td>" + izin.keperluan + "</td>" +
            "<td>" + formatWaktu(izin.tgl_izin) + "</td>" +
            "<td>" + formatWaktu(izin.estimasi_kembali) + "</td>" +
            '<td><span class="badge ' + kelasStatus + '">' + labelStatus + "</span></td>" +
            '<td><div class="aksi-grup"></div></td>';

        const wadahAksi = tr.querySelector(".aksi-grup");

        // Tombol Konfirmasi Kembali hanya muncul jika izin masih Aktif
        if (izin.status_izin === "Aktif") {
            const btnKembali = document.createElement("button");
            btnKembali.type = "button";
            btnKembali.className = "btn btn-kecil btn-sukses";
            btnKembali.textContent = "Kembali";
            btnKembali.addEventListener("click", function () {
                konfirmasiSantriKembali(izin.id_izin);
            });
            wadahAksi.appendChild(btnKembali);
        }

        const btnHapus = document.createElement("button");
        btnHapus.type = "button";
        btnHapus.className = "btn btn-kecil btn-bahaya";
        btnHapus.textContent = "Hapus";
        btnHapus.addEventListener("click", function () {
            hapusPerizinan(izin.id_izin);
        });
        wadahAksi.appendChild(btnHapus);

        tbody.appendChild(tr);
    });
}

// 6. Render Tabel Catatan Poin Kedisiplinan & Prestasi
function renderTabelPoin() {
    const tbody = document.getElementById("tbody-poin");
    const kataKunci = document.getElementById("cari-poin").value.toLowerCase().trim();
    const filterKategori = document.getElementById("filter-kategori-poin").value;

    const daftarUrut = [...db.riwayat_poin].sort(function (a, b) {
        return b.id_poin - a.id_poin;
    });

    const hasilFilter = daftarUrut.filter(function (item) {
        const santri = cariSantriById(item.id_santri);
        const namaSantri = santri ? santri.nama.toLowerCase() : "";
        const cocokTeks =
            namaSantri.includes(kataKunci) ||
            item.keterangan.toLowerCase().includes(kataKunci);
        const cocokKategori = filterKategori === "semua" || item.kategori === filterKategori;
        return cocokTeks && cocokKategori;
    });

    tbody.innerHTML = "";

    if (hasilFilter.length === 0) {
        const trKosong = document.createElement("tr");
        trKosong.innerHTML = '<td colspan="7" class="teks-tengah">Belum ada catatan poin yang sesuai.</td>';
        tbody.appendChild(trKosong);
        return;
    }

    hasilFilter.forEach(function (item, indeks) {
        const santri = cariSantriById(item.id_santri);
        const infoSantri = santri
            ? "<strong>" + santri.nama + "</strong><br><small>(" + santri.kamar + ")</small>"
            : "Santri Dihapus";

        const adalahPrestasi = item.kategori === "Prestasi";
        const kelasKategori = adalahPrestasi ? "badge-hijau" : "badge-merah";
        const teksAngka = item.jumlah_poin > 0 ? "+" + item.jumlah_poin : String(item.jumlah_poin);

        const tr = document.createElement("tr");
        tr.innerHTML =
            "<td>" + (indeks + 1) + "</td>" +
            "<td>" + formatWaktu(item.tanggal) + "</td>" +
            "<td>" + infoSantri + "</td>" +
            '<td><span class="badge ' + kelasKategori + '">' + item.kategori + "</span></td>" +
            "<td>" + item.keterangan + "</td>" +
            '<td><strong class="' + (adalahPrestasi ? "" : "") + '">' + teksAngka + " Poin</strong></td>" +
            '<td><div class="aksi-grup"></div></td>';

        const wadahAksi = tr.querySelector(".aksi-grup");
        const btnHapus = document.createElement("button");
        btnHapus.type = "button";
        btnHapus.className = "btn btn-kecil btn-bahaya";
        btnHapus.textContent = "Hapus";
        btnHapus.addEventListener("click", function () {
            hapusCatatanPoin(item.id_poin);
        });

        wadahAksi.appendChild(btnHapus);
        tbody.appendChild(tr);
    });
}

/* =========================================================
   LOGIKA TRANSAKSI DATA (TAMBAH, EDIT, HAPUS, & RELASI)
   ========================================================= */

// Simpan Data Santri (Tambah Baru atau Edit)
function prosesSimpanSantri(event) {
    event.preventDefault();

    const idEdit = document.getElementById("santri-id").value;
    const nis = document.getElementById("santri-nis").value.trim();
    const nama = document.getElementById("santri-nama").value.trim();
    const kamar = document.getElementById("santri-kamar").value.trim();
    const kelas = document.getElementById("santri-kelas").value.trim();

    if (!nis || !nama || !kamar || !kelas) {
        tampilkanToast("Semua kolom data santri wajib diisi!", "gagal");
        return;
    }

    // Validasi NIS tidak boleh duplikat
    const nisDuplikat = db.santri.some(function (s) {
        return s.nis === nis && String(s.id_santri) !== idEdit;
    });

    if (nisDuplikat) {
        tampilkanToast("NIS " + nis + " sudah terdaftar pada santri lain!", "gagal");
        return;
    }

    if (idEdit === "") {
        // Mode Tambah Santri Baru
        const santriBaru = {
            id_santri: buatIdBaru(db.santri, "id_santri"),
            nis: nis,
            nama: nama,
            kamar: kamar,
            kelas: kelas,
            status: "Di Asrama",
            poin: 100
        };
        db.santri.push(santriBaru);
        tampilkanToast("Data santri baru berhasil ditambahkan.", "sukses");
    } else {
        // Mode Edit Data Santri
        const target = cariSantriById(idEdit);
        if (target) {
            target.nis = nis;
            target.nama = nama;
            target.kamar = kamar;
            target.kelas = kelas;
            tampilkanToast("Data santri berhasil diperbarui.", "sukses");
        }
    }

    simpanDatabase();
    tutupModal("modal-santri");
    renderSemua();
}

function bukaModalEditSantri(idSantri) {
    const santri = cariSantriById(idSantri);
    if (!santri) return;

    document.getElementById("judul-modal-santri").textContent = "Edit Data Santri";
    document.getElementById("santri-id").value = santri.id_santri;
    document.getElementById("santri-nis").value = santri.nis;
    document.getElementById("santri-nama").value = santri.nama;
    document.getElementById("santri-kamar").value = santri.kamar;
    document.getElementById("santri-kelas").value = santri.kelas;

    bukaModal("modal-santri");
}

function hapusSantri(idSantri) {
    const santri = cariSantriById(idSantri);
    if (!santri) return;

    const konfirmasi = confirm(
        "Hapus data santri '" + santri.nama + "'? Semua log izin dan poin santri ini juga akan terhapus."
    );
    if (!konfirmasi) return;

    db.santri = db.santri.filter(function (s) {
        return s.id_santri !== idSantri;
    });
    // Hapus data relasi terkait (Cascade)
    db.perizinan = db.perizinan.filter(function (p) {
        return p.id_santri !== idSantri;
    });
    db.riwayat_poin = db.riwayat_poin.filter(function (r) {
        return r.id_santri !== idSantri;
    });

    simpanDatabase();
    renderSemua();
    tampilkanToast("Data santri berhasil dihapus.", "sukses");
}

// Catat Perizinan Baru (Otomatis mengubah status santri menjadi 'Sedang Izin')
function prosesSimpanIzin(event) {
    event.preventDefault();

    const idSantri = Number(document.getElementById("izin-id-santri").value);
    const jenisIzin = document.getElementById("izin-jenis").value;
    const keperluan = document.getElementById("izin-keperluan").value.trim();
    const estimasiKembali = document.getElementById("izin-estimasi").value;

    if (!idSantri || !keperluan || !estimasiKembali) {
        tampilkanToast("Lengkapi seluruh form perizinan!", "gagal");
        return;
    }

    const izinBaru = {
        id_izin: buatIdBaru(db.perizinan, "id_izin"),
        id_santri: idSantri,
        jenis_izin: jenisIzin,
        keperluan: keperluan,
        tgl_izin: ambilWaktuSekarangISO(),
        estimasi_kembali: estimasiKembali,
        status_izin: "Aktif"
    };

    db.perizinan.push(izinBaru);

    // Relasi otomatis: ubah status santri di tabel santri
    const santri = cariSantriById(idSantri);
    if (santri) {
        santri.status = "Sedang Izin";
    }

    simpanDatabase();
    tutupModal("modal-izin");
    renderSemua();
    tampilkanToast("Izin dicatat & status santri berubah menjadi Sedang Izin.", "sukses");
}

// Konfirmasi Santri Kembali ke Asrama
function konfirmasiSantriKembali(idIzin) {
    const izin = db.perizinan.find(function (item) {
        return item.id_izin === idIzin;
    });
    if (!izin) return;

    izin.status_izin = "Kembali";

    // Cek apakah santri masih punya izin aktif lainnya
    const masihAdaIzinAktif = db.perizinan.some(function (item) {
        return item.id_santri === izin.id_santri && item.status_izin === "Aktif";
    });

    if (!masihAdaIzinAktif) {
        const santri = cariSantriById(izin.id_santri);
        if (santri) {
            santri.status = "Di Asrama";
        }
    }

    simpanDatabase();
    renderSemua();
    tampilkanToast("Santri dikonfirmasi telah kembali ke asrama.", "sukses");
}

function hapusPerizinan(idIzin) {
    const izin = db.perizinan.find(function (item) {
        return item.id_izin === idIzin;
    });
    if (!izin) return;

    if (!confirm("Hapus catatan perizinan ini?")) return;

    const idSantriTerkait = izin.id_santri;
    db.perizinan = db.perizinan.filter(function (item) {
        return item.id_izin !== idIzin;
    });

    const masihAdaIzinAktif = db.perizinan.some(function (item) {
        return item.id_santri === idSantriTerkait && item.status_izin === "Aktif";
    });

    if (!masihAdaIzinAktif) {
        const santri = cariSantriById(idSantriTerkait);
        if (santri) {
            santri.status = "Di Asrama";
        }
    }

    simpanDatabase();
    renderSemua();
    tampilkanToast("Riwayat perizinan berhasil dihapus.", "sukses");
}

// Input Catatan Poin & Hitung Ulang Skor Santri
function prosesSimpanPoin(event) {
    event.preventDefault();

    const idSantri = Number(document.getElementById("poin-id-santri").value);
    const kategori = document.getElementById("poin-kategori").value;
    const keterangan = document.getElementById("poin-keterangan").value.trim();
    const besaranPoin = Math.abs(Number(document.getElementById("poin-nilai").value));

    if (!idSantri || !keterangan || besaranPoin <= 0) {
        tampilkanToast("Isi data catatan poin dengan lengkap dan benar!", "gagal");
        return;
    }

    const perubahanPoin = kategori === "Pelanggaran" ? -besaranPoin : besaranPoin;

    const catatanBaru = {
        id_poin: buatIdBaru(db.riwayat_poin, "id_poin"),
        id_santri: idSantri,
        kategori: kategori,
        keterangan: keterangan,
        jumlah_poin: perubahanPoin,
        tanggal: ambilWaktuSekarangISO()
    };

    db.riwayat_poin.push(catatanBaru);

    // Relasi otomatis: perbarui total poin santri (minimal 0)
    const santri = cariSantriById(idSantri);
    if (santri) {
        santri.poin = Math.max(0, santri.poin + perubahanPoin);
    }

    simpanDatabase();
    tutupModal("modal-poin");
    renderSemua();
    tampilkanToast("Catatan poin disimpan & skor santri diperbarui.", "sukses");
}

function hapusCatatanPoin(idPoin) {
    const catatan = db.riwayat_poin.find(function (item) {
        return item.id_poin === idPoin;
    });
    if (!catatan) return;

    if (!confirm("Hapus catatan poin ini? Skor poin santri akan disesuaikan kembali.")) return;

    // Kembalikan skor poin santri sebelum catatan dihapus
    const santri = cariSantriById(catatan.id_santri);
    if (santri) {
        santri.poin = Math.max(0, santri.poin - catatan.jumlah_poin);
    }

    db.riwayat_poin = db.riwayat_poin.filter(function (item) {
        return item.id_poin !== idPoin;
    });

    simpanDatabase();
    renderSemua();
    tampilkanToast("Catatan poin dihapus & skor santri dikembalikan.", "sukses");
}

/* =========================================================
   KONTROL ANTARMUKA (MODAL, TAB, TEMA GELAP, & EVENT LISTENER)
   ========================================================= */
function bukaModal(idModal) {
    document.getElementById(idModal).classList.add("show");
}

function tutupModal(idModal) {
    document.getElementById(idModal).classList.remove("show");
}

function terapkanTema(tema) {
    document.documentElement.setAttribute("data-theme", tema);
    localStorage.setItem(KUNCI_TEMA, tema);
    const btnTema = document.getElementById("btn-tema");
    btnTema.textContent = tema === "dark" ? "Mode Terang" : "Mode Gelap";
}

function perbaruiPreviewDampakPoin() {
    const kategori = document.getElementById("poin-kategori").value;
    const nilai = Math.abs(Number(document.getElementById("poin-nilai").value)) || 0;
    const infoTeks = document.getElementById("preview-dampak-poin");

    if (kategori === "Pelanggaran") {
        infoTeks.textContent = "Dampak: Skor santri akan berkurang " + nilai + " poin.";
    } else {
        infoTeks.textContent = "Dampak: Skor santri akan bertambah " + nilai + " poin.";
    }
}

// Inisialisasi seluruh event saat halaman HTML selesai dimuat
document.addEventListener("DOMContentLoaded", function () {
    // 1. Jalankan jam real-time & muat tema tersimpan
    perbaruiJamNavbar();
    setInterval(perbaruiJamNavbar, 1000);

    const temaTersimpan = localStorage.getItem(KUNCI_TEMA) || "light";
    terapkanTema(temaTersimpan);

    // 2. Render seluruh data awal ke layar
    renderSemua();

    // 3. Tombol Ganti Tema (Dark Mode / Light Mode)
    document.getElementById("btn-tema").addEventListener("click", function () {
        const temaAktif = document.documentElement.getAttribute("data-theme");
        terapkanTema(temaAktif === "light" ? "dark" : "light");
    });

    // 4. Tombol Reset Data Contoh
    document.getElementById("btn-reset-data").addEventListener("click", function () {
        if (confirm("Kembalikan seluruh data ke data contoh awal?")) {
            localStorage.removeItem(KUNCI_DB);
            db = muatDatabase();
            renderSemua();
            tampilkanToast("Database berhasil di-reset ke data awal.", "sukses");
        }
    });

    // 5. Navigasi Tab Tanpa Reload Halaman
    const tombolTab = document.querySelectorAll(".tab-btn");
    const panelTab = document.querySelectorAll(".panel-tab");

    tombolTab.forEach(function (btn) {
        btn.addEventListener("click", function () {
            tombolTab.forEach(function (b) {
                b.classList.remove("active");
            });
            panelTab.forEach(function (p) {
                p.classList.remove("active");
            });

            btn.classList.add("active");
            const targetPanelId = btn.getAttribute("data-tab");
            document.getElementById(targetPanelId).classList.add("active");
        });
    });

    // 6. Event Listener Live Search & Filter pada Ketiga Tabel
    document.getElementById("cari-santri").addEventListener("input", renderTabelSantri);
    document.getElementById("filter-kamar").addEventListener("change", renderTabelSantri);
    document.getElementById("filter-status").addEventListener("change", renderTabelSantri);

    document.getElementById("cari-izin").addEventListener("input", renderTabelIzin);
    document.getElementById("filter-status-izin").addEventListener("change", renderTabelIzin);

    document.getElementById("cari-poin").addEventListener("input", renderTabelPoin);
    document.getElementById("filter-kategori-poin").addEventListener("change", renderTabelPoin);

    // 7. Tombol Buka Modal Form
    document.getElementById("btn-buka-modal-santri").addEventListener("click", function () {
        document.getElementById("form-santri").reset();
        document.getElementById("santri-id").value = "";
        document.getElementById("judul-modal-santri").textContent = "Tambah Data Santri";
        bukaModal("modal-santri");
    });

    document.getElementById("btn-buka-modal-izin").addEventListener("click", function () {
        document.getElementById("form-izin").reset();
        document.getElementById("izin-estimasi").value = ambilWaktuSekarangISO();
        bukaModal("modal-izin");
    });

    document.getElementById("btn-buka-modal-poin").addEventListener("click", function () {
        document.getElementById("form-poin").reset();
        perbaruiPreviewDampakPoin();
        bukaModal("modal-poin");
    });

    // 8. Tombol Tutup Modal & Klik Area Gelap di Luar Modal
    document.querySelectorAll("[data-tutup]").forEach(function (tombol) {
        tombol.addEventListener("click", function () {
            const idModal = tombol.getAttribute("data-tutup");
            tutupModal(idModal);
        });
    });

    document.querySelectorAll(".modal-latar").forEach(function (latar) {
        latar.addEventListener("click", function (e) {
            if (e.target === latar) {
                latar.classList.remove("show");
            }
        });
    });

    // 9. Preview Dampak Poin Real-Time saat Input Angka / Kategori
    document.getElementById("poin-kategori").addEventListener("change", perbaruiPreviewDampakPoin);
    document.getElementById("poin-nilai").addEventListener("input", perbaruiPreviewDampakPoin);

    // 10. Submit Ketiga Formulir
    document.getElementById("form-santri").addEventListener("submit", prosesSimpanSantri);
    document.getElementById("form-izin").addEventListener("submit", prosesSimpanIzin);
    document.getElementById("form-poin").addEventListener("submit", prosesSimpanPoin);
});