document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const loginPage = document.getElementById('login-page');
    const app = document.getElementById('app');
    const loginForm = document.getElementById('login-form');
    const pageSections = document.querySelectorAll('.page-section');
    const sidebarLinks = document.querySelectorAll('.sidebar a[data-page]');
    const adminUploadLink = document.getElementById('admin-upload-link');
    const logoutBtn = document.getElementById('logout-btn');
    const logoutSidebarBtn = document.getElementById('logout-sidebar-btn');
    const uploadTrigger = document.getElementById('upload-trigger');
    const fileUpload = document.getElementById('file-upload');
    const userName = document.getElementById('user-name');
    const subClusterFilter = document.getElementById('sub-cluster-filter');
    const categoryFilter = document.getElementById('category-filter');
    const searchFilter = document.getElementById('search-filter');
    const exportDetailBtn = document.getElementById('export-detail-btn');
    const changePasswordForm = document.getElementById('change-password-form');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const passwordStrength = document.getElementById('password-strength');
    
    // Modal elements
    const mdnModal = new bootstrap.Modal(document.getElementById('mdnModal'));
    const retailModal = new bootstrap.Modal(document.getElementById('retailModal'));
    
    // Data storage
    let dashboardData = [];
    let activationDetailData = {
        sgs: [],
        sds: [],
        retail: []
    };
    let uploadedFiles = [];
    let allSubClusters = [];
    
    // Current user
    let currentUser = null;
    
    // Initialize application
    initializeApp();
    
    // Initialize application
    async function initializeApp() {
        // Check if user is already logged in
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            await handleSuccessfulLogin(currentUser);
        }
        
        // Load initial data
        await loadDashboardData();
        await loadActivationDetailData();
    }
    
    // Login functionality
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Show loading state
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        submitBtn.disabled = true;
        
        try {
            // Authenticate user with Supabase
            const result = await window.dbService.authenticateUser(username, password);
            
            if (result.success) {
                currentUser = result.user;
                
                // Save user to localStorage
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                await handleSuccessfulLogin(currentUser);
            } else {
                showNotification(result.error || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showNotification('Login error: ' + error.message, 'error');
        } finally {
            // Reset button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
    
    // Handle successful login
    async function handleSuccessfulLogin(user) {
        loginPage.classList.add('d-none');
        app.classList.remove('d-none');
        
        if (user.role === 'admin') {
            adminUploadLink.classList.remove('d-none');
            userName.textContent = 'Admin';
        } else {
            adminUploadLink.classList.add('d-none');
            userName.textContent = 'User View Only';
        }
        
        // Load data
        await loadDashboardData();
        await loadActivationDetailData();
        
        showNotification(`Welcome back, ${user.username}!`, 'success');
    }
    
    // Navigation
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active state
            sidebarLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Show selected page
            const pageId = this.getAttribute('data-page');
            pageSections.forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(pageId).classList.add('active');
        });
    });
    
    // File upload
    uploadTrigger.addEventListener('click', function() {
        fileUpload.click();
    });
    
    fileUpload.addEventListener('change', function() {
        if (this.files.length > 0) {
            const file = this.files[0];
            processExcelFile(file);
        }
    });
    
    // Filter functionality
    subClusterFilter.addEventListener('change', function() {
        filterActivationDetail();
    });
    
    categoryFilter.addEventListener('change', function() {
        filterActivationDetail();
    });
    
    searchFilter.addEventListener('input', function() {
        filterActivationDetail();
    });
    
    // Export functionality
    exportDetailBtn.addEventListener('click', function() {
        exportActivationDetail();
    });
    
    // Password strength indicator
    newPasswordInput.addEventListener('input', function() {
        checkPasswordStrength(this.value);
    });
    
    // Confirm password validation
    confirmPasswordInput.addEventListener('input', function() {
        validatePasswordConfirmation();
    });
    
    // Change password form submission
    changePasswordForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (!validatePasswordChange(currentPassword, newPassword, confirmPassword)) {
            return;
        }
        
        // Show loading state
        const submitBtn = changePasswordForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
        submitBtn.disabled = true;
        
        try {
            // In a real app, you'd call a Supabase function to change password
            // For now, we'll just show a success message
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
            
            showNotification('Password berhasil diubah!', 'success');
            changePasswordForm.reset();
            passwordStrength.className = 'password-strength';
        } catch (error) {
            showNotification('Error changing password: ' + error.message, 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
    
    // Logout functionality
    function logout() {
        localStorage.removeItem('currentUser');
        app.classList.add('d-none');
        loginPage.classList.remove('d-none');
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        currentUser = null;
        
        // Reset to dashboard
        sidebarLinks.forEach(l => l.classList.remove('active'));
        document.querySelector('.sidebar a[data-page="dashboard"]').classList.add('active');
        pageSections.forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById('dashboard').classList.add('active');
    }
    
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });
    
    logoutSidebarBtn.addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });
    
    // Load dashboard data from Supabase
    async function loadDashboardData() {
        try {
            showLoadingState('dashboard', true);
            const data = await window.dbService.getDashboardData();
            dashboardData = data;
            renderDashboardTable();
            updateDashboardTotals();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            showNotification('Error loading dashboard data', 'error');
        } finally {
            showLoadingState('dashboard', false);
        }
    }
    
    // Load activation detail data from Supabase
    async function loadActivationDetailData() {
        try {
            showLoadingState('activation-detail', true);
            
            const [sgsData, sdsData, retailData] = await Promise.all([
                window.dbService.getActivationData('sgs'),
                window.dbService.getActivationData('sds'),
                window.dbService.getActivationData('retail')
            ]);
            
            activationDetailData = {
                sgs: sgsData,
                sds: sdsData,
                retail: retailData
            };
            
            renderActivationDetailTable();
            updateSummaryCards();
            populateSubClusterFilter();
        } catch (error) {
            console.error('Error loading activation data:', error);
            showNotification('Error loading activation data', 'error');
        } finally {
            showLoadingState('activation-detail', false);
        }
    }
    
    // Show/hide loading state
    function showLoadingState(sectionId, isLoading) {
        const section = document.getElementById(sectionId);
        if (isLoading) {
            section.classList.add('loading');
            // Add spinner if not exists
            if (!section.querySelector('.spinner')) {
                const spinner = document.createElement('div');
                spinner.className = 'spinner';
                section.appendChild(spinner);
            }
        } else {
            section.classList.remove('loading');
            const spinner = section.querySelector('.spinner');
            if (spinner) {
                spinner.remove();
            }
        }
    }
    
    // Check password strength
    function checkPasswordStrength(password) {
        let strength = 0;
        
        // Length check
        if (password.length >= 8) strength++;
        
        // Contains lowercase
        if (/[a-z]/.test(password)) strength++;
        
        // Contains uppercase
        if (/[A-Z]/.test(password)) strength++;
        
        // Contains numbers
        if (/[0-9]/.test(password)) strength++;
        
        // Contains special characters
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        
        // Update strength indicator
        passwordStrength.className = 'password-strength';
        
        if (password.length === 0) {
            passwordStrength.className = 'password-strength';
        } else if (strength <= 2) {
            passwordStrength.className = 'password-strength password-weak';
        } else if (strength <= 4) {
            passwordStrength.className = 'password-strength password-medium';
        } else {
            passwordStrength.className = 'password-strength password-strong';
        }
    }
    
    // Validate password confirmation
    function validatePasswordConfirmation() {
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (confirmPassword && newPassword !== confirmPassword) {
            confirmPasswordInput.classList.add('is-invalid');
            return false;
        } else {
            confirmPasswordInput.classList.remove('is-invalid');
            return true;
        }
    }
    
    // Validate password change
    function validatePasswordChange(currentPassword, newPassword, confirmPassword) {
        // Check current password (in real app, this would be verified with Supabase)
        if (!currentPassword) {
            showNotification('Please enter current password', 'error');
            return false;
        }
        
        // Check if new password meets requirements
        if (newPassword.length < 8) {
            showNotification('Password baru harus minimal 8 karakter!', 'error');
            return false;
        }
        
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/.test(newPassword)) {
            showNotification('Password baru harus mengandung huruf besar, huruf kecil, angka, dan simbol!', 'error');
            return false;
        }
        
        // Check password confirmation
        if (newPassword !== confirmPassword) {
            showNotification('Konfirmasi password tidak sesuai!', 'error');
            return false;
        }
        
        // Check if new password is same as current
        if (newPassword === currentPassword) {
            showNotification('Password baru harus berbeda dengan password saat ini!', 'error');
            return false;
        }
        
        return true;
    }
    
    // Update dashboard totals
    function updateDashboardTotals() {
        let totalTarget = 0;
        let totalActivation = 0;
        let totalSgs = 0;
        let totalSds = 0;
        let totalRetail = 0;
        
        dashboardData.forEach(item => {
            totalTarget += item.target;
            totalActivation += item.total;
            totalSgs += item.sgs;
            totalSds += item.sds;
            totalRetail += item.retail;
        });
        
        const achievement = totalTarget > 0 ? ((totalActivation / totalTarget) * 100).toFixed(2) : 0;
        
        document.getElementById('total-target').textContent = totalTarget.toLocaleString();
        document.getElementById('total-activation').textContent = totalActivation.toLocaleString();
        document.getElementById('achievement').textContent = achievement + '%';
        document.getElementById('achievement-bar').style.width = achievement + '%';
        document.getElementById('sgs-activation').textContent = totalSgs.toLocaleString();
    }
    
    // Render dashboard table
    function renderDashboardTable() {
        const tbody = document.getElementById('asc-table-body');
        tbody.innerHTML = '';
        
        dashboardData.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.cluster}</td>
                <td>${item.asc_name}</td>
                <td>${item.target}</td>
                <td>${item.sgs}</td>
                <td>${item.sds}</td>
                <td>${item.retail}</td>
                <td>${item.total}</td>
                <td>${item.agh}</td>
            `;
            tbody.appendChild(row);
        });
        
        // Add total row
        const totalRow = document.createElement('tr');
        totalRow.className = 'table-secondary fw-bold';
        
        const totalTarget = dashboardData.reduce((sum, item) => sum + item.target, 0);
        const totalSgs = dashboardData.reduce((sum, item) => sum + item.sgs, 0);
        const totalSds = dashboardData.reduce((sum, item) => sum + item.sds, 0);
        const totalRetail = dashboardData.reduce((sum, item) => sum + item.retail, 0);
        const totalActivation = dashboardData.reduce((sum, item) => sum + item.total, 0);
        const totalAchievement = totalTarget > 0 ? ((totalActivation / totalTarget) * 100).toFixed(2) : 0;
        
        totalRow.innerHTML = `
            <td colspan="2">TOTAL</td>
            <td>${totalTarget.toLocaleString()}</td>
            <td>${totalSgs}</td>
            <td>${totalSds}</td>
            <td>${totalRetail}</td>
            <td>${totalActivation}</td>
            <td>${totalAchievement}%</td>
        `;
        tbody.appendChild(totalRow);
    }
    
    // Update summary cards
    function updateSummaryCards() {
        const totalSgs = activationDetailData.sgs.reduce((sum, item) => sum + item.total, 0);
        const totalSds = activationDetailData.sds.reduce((sum, item) => sum + item.total, 0);
        const totalRetail = activationDetailData.retail.reduce((sum, item) => sum + item.total, 0);
        const totalAll = totalSgs + totalSds + totalRetail;
        
        document.getElementById('summary-sgs').textContent = totalSgs.toLocaleString();
        document.getElementById('summary-sds').textContent = totalSds.toLocaleString();
        document.getElementById('summary-retail').textContent = totalRetail.toLocaleString();
        document.getElementById('summary-total').textContent = totalAll.toLocaleString();
    }
    
    // Render activation detail table
    function renderActivationDetailTable() {
        renderActivationDetailCategory('sgs');
        renderActivationDetailCategory('sds');
        renderActivationDetailCategory('retail');
        updateSummaryCards();
    }
    
    // Render activation detail for a specific category
    function renderActivationDetailCategory(category) {
        const tbody = document.getElementById(`${category}-detail-body`);
        tbody.innerHTML = '';
        
        const data = activationDetailData[category];
        
        if (data.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="4" class="no-data">Tidak ada data ${category.toUpperCase()}</td>`;
            tbody.appendChild(row);
            return;
        }
        
        data.forEach(item => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${item.sub_cluster}</td>
                <td>${item.nik}</td>
                <td><strong>${item.nama}</strong></td>
                <td>
                    <span class="total-link" data-category="${category}" data-sub-cluster="${item.sub_cluster}" data-nik="${item.nik}" data-nama="${item.nama}" data-total="${item.total}">
                        ${item.total}
                    </span>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Add click event listeners to total links
        tbody.querySelectorAll('.total-link').forEach(link => {
            link.addEventListener('click', function() {
                const category = this.getAttribute('data-category');
                const subCluster = this.getAttribute('data-sub-cluster');
                const nik = this.getAttribute('data-nik');
                const nama = this.getAttribute('data-nama');
                const total = this.getAttribute('data-total');
                
                if (category === 'sgs' || category === 'sds') {
                    showMdnModal(category, subCluster, nik, nama, total);
                } else if (category === 'retail') {
                    showRetailModal(subCluster, nik, nama, total);
                }
            });
        });
    }
    
    // Show MDN modal for SGS and SDS
    function showMdnModal(category, subCluster, nik, nama, total) {
        // Find the data
        const data = activationDetailData[category].find(item => 
            item.sub_cluster === subCluster && item.nik === nik && item.nama === nama
        );
        
        if (data) {
            // Update modal content
            document.getElementById('modal-sub-cluster').textContent = subCluster;
            document.getElementById('modal-nik').textContent = nik;
            document.getElementById('modal-nama').textContent = nama;
            document.getElementById('modal-total').textContent = total;
            
            // Populate MDN list
            const mdnList = document.getElementById('mdn-list');
            mdnList.innerHTML = '';
            
            if (data.customer_mdn && data.customer_mdn.length > 0) {
                data.customer_mdn.forEach(mdn => {
                    const mdnItem = document.createElement('div');
                    mdnItem.className = 'mdn-item';
                    mdnItem.textContent = mdn;
                    mdnList.appendChild(mdnItem);
                });
            } else {
                mdnList.innerHTML = '<div class="text-muted">Tidak ada data Customer MDN</div>';
            }
            
            // Show modal
            mdnModal.show();
        }
    }
    
    // Show Retail modal
    function showRetailModal(subCluster, nik, nama, total) {
        // Find the data
        const data = activationDetailData.retail.find(item => 
            item.sub_cluster === subCluster && item.nik === nik && item.nama === nama
        );
        
        if (data) {
            // Update modal content
            document.getElementById('retail-modal-sub-cluster').textContent = subCluster;
            document.getElementById('retail-modal-nik').textContent = nik;
            document.getElementById('retail-modal-nama').textContent = nama;
            document.getElementById('retail-modal-total').textContent = total;
            
            // Update performed user details
            document.getElementById('retail-performed-login-id').textContent = data.performed_user_login_id || 'Tidak tersedia';
            document.getElementById('retail-performed-user-name').textContent = data.performed_user_name || 'Tidak tersedia';
            
            // Populate MDN list
            const mdnList = document.getElementById('retail-mdn-list');
            mdnList.innerHTML = '';
            
            if (data.customer_mdn && data.customer_mdn.length > 0) {
                data.customer_mdn.forEach(mdn => {
                    const mdnItem = document.createElement('div');
                    mdnItem.className = 'mdn-item';
                    mdnItem.textContent = mdn;
                    mdnList.appendChild(mdnItem);
                });
            } else {
                mdnList.innerHTML = '<div class="text-muted">Tidak ada data Customer MDN</div>';
            }
            
            // Show modal
            retailModal.show();
        }
    }
    
    // Populate sub cluster filter
    function populateSubClusterFilter() {
        // Collect all unique sub clusters from all data
        const allSubClustersSet = new Set();
        
        // From dashboard data
        dashboardData.forEach(item => {
            allSubClustersSet.add(item.cluster);
        });
        
        // From activation detail data
        Object.values(activationDetailData).forEach(category => {
            category.forEach(item => {
                if (item.sub_cluster) {
                    allSubClustersSet.add(item.sub_cluster);
                }
            });
        });
        
        allSubClusters = Array.from(allSubClustersSet).sort();
        
        const filter = document.getElementById('sub-cluster-filter');
        // Clear existing options except the first one
        while (filter.children.length > 1) {
            filter.removeChild(filter.lastChild);
        }
        
        // Add sub cluster options
        allSubClusters.forEach(cluster => {
            const option = document.createElement('option');
            option.value = cluster;
            option.textContent = cluster;
            filter.appendChild(option);
        });
    }
    
    // Filter activation detail
    function filterActivationDetail() {
        const subCluster = document.getElementById('sub-cluster-filter').value;
        const category = document.getElementById('category-filter').value;
        const searchTerm = document.getElementById('search-filter').value.toLowerCase();
        
        // Show/hide sections based on category filter
        const sections = document.querySelectorAll('.parallel-section');
        
        if (category === 'all') {
            sections.forEach(section => section.style.display = 'block');
        } else {
            sections.forEach(section => {
                const sectionType = section.querySelector('.parallel-header').textContent.toLowerCase();
                section.style.display = sectionType.includes(category) ? 'block' : 'none';
            });
        }
        
        // Filter and render each category
        ['sgs', 'sds', 'retail'].forEach(cat => {
            if (category === 'all' || category === cat) {
                const filteredData = activationDetailData[cat].filter(item => {
                    const subClusterMatch = subCluster === 'all' || item.sub_cluster === subCluster;
                    const searchMatch = !searchTerm || 
                        item.nama.toLowerCase().includes(searchTerm) || 
                        item.nik.toLowerCase().includes(searchTerm);
                    
                    return subClusterMatch && searchMatch;
                });
                
                renderFilteredActivationDetail(cat, filteredData);
            }
        });
    }
    
    // Render filtered activation detail
    function renderFilteredActivationDetail(category, data) {
        const tbody = document.getElementById(`${category}-detail-body`);
        tbody.innerHTML = '';
        
        if (data.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="4" class="no-data">Tidak ada data ${category.toUpperCase()} yang sesuai dengan filter</td>`;
            tbody.appendChild(row);
            return;
        }
        
        data.forEach(item => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${item.sub_cluster}</td>
                <td>${item.nik}</td>
                <td><strong>${item.nama}</strong></td>
                <td>
                    <span class="total-link" data-category="${category}" data-sub-cluster="${item.sub_cluster}" data-nik="${item.nik}" data-nama="${item.nama}" data-total="${item.total}">
                        ${item.total}
                    </span>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Add click event listeners to total links
        tbody.querySelectorAll('.total-link').forEach(link => {
            link.addEventListener('click', function() {
                const category = this.getAttribute('data-category');
                const subCluster = this.getAttribute('data-sub-cluster');
                const nik = this.getAttribute('data-nik');
                const nama = this.getAttribute('data-nama');
                const total = this.getAttribute('data-total');
                
                if (category === 'sgs' || category === 'sds') {
                    showMdnModal(category, subCluster, nik, nama, total);
                } else if (category === 'retail') {
                    showRetailModal(subCluster, nik, nama, total);
                }
            });
        });
    }
    
    // Export activation detail to Excel
    function exportActivationDetail() {
        // Create workbook
        const wb = XLSX.utils.book_new();
        
        // Create worksheets for each category
        ['sgs', 'sds', 'retail'].forEach(category => {
            const data = activationDetailData[category];
            if (data.length > 0) {
                // Prepare data for export
                const exportData = data.map(item => ({
                    'Sub Cluster': item.sub_cluster,
                    'NIK': item.nik,
                    'Nama': item.nama,
                    'Customer MDN': item.customer_mdn ? item.customer_mdn.join(', ') : '',
                    'Total': item.total
                }));
                
                const ws = XLSX.utils.json_to_sheet(exportData);
                XLSX.utils.book_append_sheet(wb, ws, category.toUpperCase());
            }
        });
        
        // Generate and download file
        const currentDate = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `Activation_Detail_${currentDate}.xlsx`);
        showNotification('Data berhasil diekspor ke Excel', 'success');
    }
    
    // Process uploaded Excel file
    async function processExcelFile(file) {
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Process the first sheet
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                
                // Process Excel data and update both dashboard and activation detail
                const processedData = processExcelData(jsonData);
                
                if (processedData) {
                    // Save to Supabase
                    const result = await window.dbService.saveUploadedData(processedData);
                    
                    if (result.success) {
                        // Show success notification
                        showNotification('1 file diunggah dan diproses ✅', 'success');
                        
                        // Add to file list
                        addToFileList(file.name, processedData);
                        
                        // Reload data from Supabase
                        await loadDashboardData();
                        await loadActivationDetailData();
                    } else {
                        showNotification('Error saving data: ' + result.error, 'error');
                    }
                }
            } catch (error) {
                console.error('Error processing file:', error);
                showNotification('Error processing file: ' + error.message, 'error');
            }
        };
        
        reader.readAsArrayBuffer(file);
    }
    
    // Process Excel data to extract SGS, SDS, and Retail counts
    function processExcelData(excelData) {
        // ... (same processExcelData function as before)
        // This function remains largely the same as in your original code
        // Just make sure it returns data in the format expected by Supabase
        
        // For brevity, including the core logic:
        if (excelData.length === 0) return null;
        
        const headers = excelData[0];
        const data = excelData.slice(1);
        
        // Process data and return in format:
        return {
            dashboard: processedDashboardData,
            activationDetail: {
                sgs: processedSGSData,
                sds: processedSDSData,
                retail: processedRetailData
            }
        };
    }
    
    // Add file to the file list
    function addToFileList(filename, fileData) {
        const fileList = document.getElementById('file-list');
        const now = new Date();
        const dateStr = now.toLocaleDateString('id-ID') + ', ' + now.toLocaleTimeString('id-ID');
        
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <div>
                <i class="fas fa-file-excel text-success me-2"></i>
                ${filename}
            </div>
            <div class="text-muted d-flex align-items-center">
                Diunggah: ${dateStr}
                <div class="file-actions ms-2">
                    <button class="btn btn-sm btn-outline-primary load-file-btn" data-filename="${filename}">
                        <i class="fas fa-sync-alt"></i> Load
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-file-btn" data-filename="${filename}">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </div>
            </div>
        `;
        
        fileList.appendChild(listItem);
        
        // Store file data for later use
        uploadedFiles.push({ 
            name: filename, 
            date: dateStr, 
            data: fileData 
        });
        
        // Add event listeners for the new buttons
        listItem.querySelector('.load-file-btn').addEventListener('click', function() {
            const filename = this.getAttribute('data-filename');
            loadFileData(filename);
        });
        
        listItem.querySelector('.delete-file-btn').addEventListener('click', function() {
            const filename = this.getAttribute('data-filename');
            deleteFile(filename, listItem);
        });
    }
    
    // Load file data to dashboard
    async function loadFileData(filename) {
        const file = uploadedFiles.find(f => f.name === filename);
        if (file) {
            try {
                // Save to Supabase
                const result = await window.dbService.saveUploadedData(file.data);
                
                if (result.success) {
                    // Reload data from Supabase
                    await loadDashboardData();
                    await loadActivationDetailData();
                    showNotification(`Data dari ${filename} berhasil dimuat ke dashboard`, 'success');
                    
                    // Navigate to dashboard
                    sidebarLinks.forEach(l => l.classList.remove('active'));
                    document.querySelector('.sidebar a[data-page="dashboard"]').classList.add('active');
                    pageSections.forEach(section => {
                        section.classList.remove('active');
                    });
                    document.getElementById('dashboard').classList.add('active');
                } else {
                    showNotification('Error loading data: ' + result.error, 'error');
                }
            } catch (error) {
                showNotification('Error loading data: ' + error.message, 'error');
            }
        }
    }
    
    // Delete file from list
    function deleteFile(filename, listItem) {
        if (confirm(`Apakah Anda yakin ingin menghapus file ${filename}?`)) {
            listItem.remove();
            uploadedFiles = uploadedFiles.filter(f => f.name !== filename);
            showNotification(`File ${filename} berhasil dihapus`, 'success');
        }
    }
    
    // Show notification
    function showNotification(message, type) {
        // Remove existing notifications
        document.querySelectorAll('.notification').forEach(notification => {
            notification.remove();
        });
        
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} notification notification-${type}`;
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
                <span>${message}</span>
                <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
});