document.addEventListener('DOMContentLoaded', () => {
    const GAS_URL = window.APP_CONFIG.GAS_URL;
    let quill;

    // --- DOM Elements ---
    const form = document.getElementById('post-form');
    const formTitle = document.getElementById('form-title');
    const inputId = document.getElementById('post-id');
    const inputAction = document.getElementById('post-action');
    const inputTema = document.getElementById('post-tema');
    const inputJudul = document.getElementById('post-judul');
    const inputFoto = document.getElementById('post-foto');
    const inputVideo = document.getElementById('post-video');
    const inputLink = document.getElementById('post-link');
    
    const btnCancel = document.getElementById('btn-cancel');
    const btnSubmit = document.getElementById('btn-submit');
    const formMessage = document.getElementById('form-message');
    
    const postTbody = document.getElementById('post-tbody');
    const loadingList = document.getElementById('loading-list');

    let allPosts = [];

    // Custom Image Handler
    function imageHandler() {
        const url = prompt('Masukkan URL gambar (disarankan menggunakan imgbb dll):');
        if (url) {
            const range = quill.getSelection(true);
            quill.insertEmbed(range.index, 'image', url);
        }
    }

    // --- Initialize Quill Editor ---
    quill = new Quill('#editor-container', {
        theme: 'snow',
        modules: {
            toolbar: {
                container: [
                    [{ 'header': [2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link', 'image', 'video'],
                    ['clean']
                ],
                handlers: {
                    image: imageHandler
                }
            }
        },
        placeholder: 'Tulis isi konten di sini...'
    });

    // Tambahkan tooltip pada tombol editor
    document.querySelectorAll('.ql-bold').forEach(el => el.title = 'Tebal (Bold)');
    document.querySelectorAll('.ql-italic').forEach(el => el.title = 'Miring (Italic)');
    document.querySelectorAll('.ql-underline').forEach(el => el.title = 'Garis Bawah (Underline)');
    document.querySelectorAll('.ql-strike').forEach(el => el.title = 'Coret (Strikethrough)');
    document.querySelectorAll('.ql-blockquote').forEach(el => el.title = 'Kutipan (Blockquote)');
    document.querySelectorAll('.ql-list[value="ordered"]').forEach(el => el.title = 'Daftar Angka');
    document.querySelectorAll('.ql-list[value="bullet"]').forEach(el => el.title = 'Daftar Titik');
    document.querySelectorAll('.ql-link').forEach(el => el.title = 'Sisipkan Tautan (Link)');
    document.querySelectorAll('.ql-image').forEach(el => el.title = 'Sisipkan Gambar via URL');
    document.querySelectorAll('.ql-video').forEach(el => el.title = 'Sisipkan Video Youtube');
    document.querySelectorAll('.ql-clean').forEach(el => el.title = 'Hapus Format (Clean)');
    document.querySelectorAll('.ql-header').forEach(el => el.title = 'Ukuran Judul (Header)');

    // --- Fetch & Render List ---
    async function fetchPosts() {
        try {
            loadingList.style.display = 'block';
            postTbody.innerHTML = '';
            
            const url = `${GAS_URL}?type=all&v=${Date.now()}`;
            const response = await fetch(url);
            
            if (!response.ok) throw new Error('Gagal mengambil data');
            
            allPosts = await response.json();
            renderTable(allPosts);
            
        } catch (error) {
            console.error(error);
            loadingList.textContent = 'Gagal memuat data. Periksa koneksi internet.';
        } finally {
            loadingList.style.display = 'none';
        }
    }

    function renderTable(posts) {
        postTbody.innerHTML = '';
        if (posts.length === 0) {
            postTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Belum ada postingan.</td></tr>';
            return;
        }

        posts.forEach(post => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${post.tanggal}</td>
                <td><strong>${post.judul}</strong></td>
                <td>${post.tema}</td>
                <td class="action-buttons">
                    <button type="button" class="btn-edit" data-id="${post.id}">Edit</button>
                    <button type="button" class="btn-danger" data-id="${post.id}">Hapus</button>
                </td>
            `;
            postTbody.appendChild(tr);
        });

        // Attach event listeners for edit and delete buttons
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => loadPostForEdit(btn.dataset.id));
        });
        document.querySelectorAll('.btn-danger').forEach(btn => {
            btn.addEventListener('click', () => deletePost(btn.dataset.id));
        });
    }

    // --- Form Handling ---
    function showMessage(msg, isSuccess = true) {
        formMessage.textContent = msg;
        formMessage.className = 'message ' + (isSuccess ? 'success' : 'error');
        setTimeout(() => {
            formMessage.style.display = 'none';
        }, 5000);
    }

    function resetForm() {
        form.reset();
        quill.root.innerHTML = '';
        inputId.value = '';
        inputAction.value = 'add';
        formTitle.textContent = 'Tulis Postingan Baru';
        btnSubmit.textContent = 'Publikasikan';
        btnCancel.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    btnCancel.addEventListener('click', resetForm);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get Quill HTML content
        const htmlContent = quill.root.innerHTML;
        if (quill.getText().trim().length === 0 && !htmlContent.includes('<img') && !htmlContent.includes('<iframe')) {
            alert('Isi postingan tidak boleh kosong!');
            return;
        }

        const payload = {
            action: inputAction.value,
            id: inputId.value,
            tema: inputTema.value,
            judul: inputJudul.value,
            isi: htmlContent,
            foto: inputFoto.value,
            video: inputVideo.value,
            link_eksternal: inputLink.value
        };

        try {
            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Menyimpan...';

            const response = await fetch(GAS_URL, {
                method: 'POST',
                // Harus menggunakan text/plain agar tidak trigger CORS preflight yang ditolak GAS
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            
            if (result.success) {
                showMessage(result.message, true);
                resetForm();
                fetchPosts(); // Refresh list
            } else {
                showMessage('Terjadi kesalahan: ' + result.message, false);
            }
            
        } catch (error) {
            console.error(error);
            showMessage('Gagal menghubungi server. Periksa koneksi Anda.', false);
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = inputAction.value === 'add' ? 'Publikasikan' : 'Simpan Perubahan';
        }
    });

    // --- Edit Post ---
    function loadPostForEdit(id) {
        const post = allPosts.find(p => p.id.toString() === id.toString());
        if (!post) return;

        inputId.value = post.id;
        inputAction.value = 'edit';
        inputTema.value = post.tema;
        inputJudul.value = post.judul;
        quill.root.innerHTML = post.isi;
        inputFoto.value = post.foto;
        inputVideo.value = post.video;
        inputLink.value = post.link_eksternal;

        formTitle.textContent = 'Edit Postingan';
        btnSubmit.textContent = 'Simpan Perubahan';
        btnCancel.style.display = 'inline-block';
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // --- Delete Post ---
    async function deletePost(id) {
        if (!confirm('Apakah Anda yakin ingin menghapus postingan ini?')) return;

        try {
            // Tampilkan loading di baris tabel
            const tr = document.querySelector(`.btn-danger[data-id="${id}"]`).closest('tr');
            tr.style.opacity = '0.5';

            const payload = {
                action: 'delete',
                id: id
            };

            const response = await fetch(GAS_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            
            if (result.success) {
                alert('Postingan berhasil dihapus.');
                fetchPosts();
            } else {
                alert('Gagal menghapus: ' + result.message);
                tr.style.opacity = '1';
            }
            
        } catch (error) {
            console.error(error);
            alert('Gagal menghubungi server.');
        }
    }

    // --- Init ---
    fetchPosts();
});
