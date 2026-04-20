import os
import re

directories = ['d:/Project/Study4YouV2/frontend/src/pages', 'd:/Project/Study4YouV2/frontend/src/pages/admin']

for directory in directories:
    for filename in os.listdir(directory):
        if filename.endswith('.tsx'):
            filepath = os.path.join(directory, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Remove imports
            content = re.sub(r'(?m)^import\s+(?:DashboardLayout|AdminLayout)\s+from\s+[\'\"]@/components/(?:admin/)?(?:DashboardLayout|AdminLayout)[\'\"];?\s*\n', '', content)
            
            # Remove opening tags
            content = re.sub(r'<DashboardLayout[^>]*>', '<>', content)
            content = re.sub(r'<AdminLayout[^>]*>', '<>', content)
            
            # Remove closing tags 
            content = re.sub(r'</DashboardLayout>', '</>', content)
            content = re.sub(r'</AdminLayout>', '</>', content)

            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
