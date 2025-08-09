// 密钥管理系统 MkDocs 功能增强脚本

(function() {
    'use strict';

    // 页面加载完成后执行
    document.addEventListener('DOMContentLoaded', function() {
        
        // 添加代码块复制功能
        addCodeCopyButtons();
        
        // 优化图片加载
        optimizeImages();
        
        // 添加表格排序功能
        addTableSorting();
        
        // 添加返回顶部按钮
        addBackToTopButton();
        
        // 优化搜索体验
        enhanceSearch();
    });

    // 为代码块添加复制按钮
    function addCodeCopyButtons() {
        const codeBlocks = document.querySelectorAll('pre code');
        
        codeBlocks.forEach(function(codeBlock) {
            const pre = codeBlock.parentElement;
            
            // 检查是否已经有复制按钮
            if (pre.querySelector('.copy-button')) {
                return;
            }
            
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-button';
            copyButton.innerHTML = '复制';
            copyButton.style.cssText = `
                position: absolute;
                top: 8px;
                right: 8px;
                background: #3f51b5;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 4px 8px;
                font-size: 12px;
                cursor: pointer;
                opacity: 0;
                transition: opacity 0.3s;
            `;
            
            pre.style.position = 'relative';
            pre.appendChild(copyButton);
            
            // 鼠标悬停显示按钮
            pre.addEventListener('mouseenter', function() {
                copyButton.style.opacity = '1';
            });
            
            pre.addEventListener('mouseleave', function() {
                copyButton.style.opacity = '0';
            });
            
            // 复制功能
            copyButton.addEventListener('click', function() {
                const text = codeBlock.textContent;
                navigator.clipboard.writeText(text).then(function() {
                    copyButton.innerHTML = '已复制!';
                    setTimeout(function() {
                        copyButton.innerHTML = '复制';
                    }, 2000);
                }).catch(function() {
                    // 降级方案
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    
                    copyButton.innerHTML = '已复制!';
                    setTimeout(function() {
                        copyButton.innerHTML = '复制';
                    }, 2000);
                });
            });
        });
    }

    // 优化图片加载
    function optimizeImages() {
        const images = document.querySelectorAll('img[src*="image-20250805"]');
        
        images.forEach(function(img) {
            // 添加懒加载
            img.loading = 'lazy';
            
            // 添加点击放大功能
            img.style.cursor = 'pointer';
            img.addEventListener('click', function() {
                showImageModal(img.src, img.alt);
            });
        });
    }

    // 图片模态框
    function showImageModal(src, alt) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            cursor: pointer;
        `;
        
        const img = document.createElement('img');
        img.src = src;
        img.alt = alt;
        img.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
            border-radius: 8px;
        `;
        
        modal.appendChild(img);
        document.body.appendChild(modal);
        
        modal.addEventListener('click', function() {
            document.body.removeChild(modal);
        });
    }

    // 为表格添加排序功能
    function addTableSorting() {
        const tables = document.querySelectorAll('table');
        
        tables.forEach(function(table) {
            const headers = table.querySelectorAll('th');
            
            headers.forEach(function(header, index) {
                header.style.cursor = 'pointer';
                header.addEventListener('click', function() {
                    sortTable(table, index);
                });
            });
        });
    }

    // 表格排序函数
    function sortTable(table, columnIndex) {
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        
        rows.sort(function(a, b) {
            const aValue = a.cells[columnIndex].textContent.trim();
            const bValue = b.cells[columnIndex].textContent.trim();
            
            // 尝试数字排序
            const aNum = parseFloat(aValue);
            const bNum = parseFloat(bValue);
            
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return aNum - bNum;
            }
            
            // 字符串排序
            return aValue.localeCompare(bValue, 'zh-CN');
        });
        
        // 重新插入排序后的行
        rows.forEach(function(row) {
            tbody.appendChild(row);
        });
    }

    // 添加返回顶部按钮
    function addBackToTopButton() {
        const button = document.createElement('button');
        button.innerHTML = '↑';
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            background: #3f51b5;
            color: white;
            border: none;
            border-radius: 50%;
            font-size: 18px;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.3s;
            z-index: 1000;
            display: none;
        `;
        
        document.body.appendChild(button);
        
        // 滚动监听
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                button.style.display = 'block';
                setTimeout(function() {
                    button.style.opacity = '1';
                }, 10);
            } else {
                button.style.opacity = '0';
                setTimeout(function() {
                    button.style.display = 'none';
                }, 300);
            }
        });
        
        // 点击返回顶部
        button.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // 优化搜索体验
    function enhanceSearch() {
        const searchInput = document.querySelector('.md-search__input');
        
        if (searchInput) {
            // 添加搜索提示
            searchInput.placeholder = '搜索文档... (支持中文)';
            
            // 添加搜索历史
            searchInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && searchInput.value.trim()) {
                    saveSearchHistory(searchInput.value.trim());
                }
            });
        }
    }

    // 保存搜索历史
    function saveSearchHistory(query) {
        let history = JSON.parse(localStorage.getItem('mkdocs_search_history') || '[]');
        
        // 避免重复
        if (!history.includes(query)) {
            history.unshift(query);
            history = history.slice(0, 10); // 只保留最近10条
            localStorage.setItem('mkdocs_search_history', JSON.stringify(history));
        }
    }

})(); 