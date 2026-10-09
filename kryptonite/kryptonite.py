import os
import re
import sys
from colorama import Fore, Style, init

init(autoreset=True)

def parse_imports(file_path):
    imports = []
    with open(file_path, "r") as file:
        lines = file.readlines()

    for line in lines:
        line = line.strip()
        if line.startswith("import"):
            match = re.match(r"import (.+)", line)
            if match:
                imports.append(match.group(1))
        elif line.startswith("from"):
            match = re.match(r"from (.+) import (.+)", line)
            if match:
                module, symbols = match.groups()
                imports.append(f"{module} > {symbols}")

    if imports:
        return f'<div style="color: lightblue;">imports:\n' + "\n".join([f"  {i+1}. {imp}" for i, imp in enumerate(imports)]) + '</div>'
    else:
        return ""  # Return an empty string if no imports are found

def parse_environment_variables(file_path):
    env_vars = []
    with open(file_path, "r") as file:
        lines = file.readlines()

    # Match os.getenv calls
    env_var_pattern = re.compile(r"os\.getenv\(['\"](.*?)['\"]")
    for line in lines:
        line = line.strip()
        match = env_var_pattern.search(line)
        if match:
            env_vars.append(match.group(1))

    if env_vars:
        return f'<div style="color: green;">env vars:\n' + "\n".join([f"  {i+1}. {var}" for i, var in enumerate(env_vars)]) + '</div>'
    else:
        return ""  # Return an empty string if no env vars are found

def parse_functions_and_classes(file_path):
    functions = []
    classes = []
    class_pattern = re.compile(r"^class (\w+)")
    function_pattern = re.compile(r"^\s*(async\s+)?def (\w+)\(")  # Matches both async and regular functions

    with open(file_path, "r") as file:
        lines = file.readlines()

    for line in lines:
        line = line.strip()
        class_match = class_pattern.match(line)
        if class_match:
            classes.append(class_match.group(1))
        function_match = function_pattern.match(line)
        if function_match:
            is_async = function_match.group(1)  # Check if the function is async
            func_name = function_match.group(2)
            if is_async:
                functions.append(f"@{func_name}")  # Add '@' for async functions
            else:
                functions.append(func_name)

    classes_result = (
        f'<div style="color: purple;">classes:\n' +
        "\n".join([f"  {i+1}. {cls}" for i, cls in enumerate(classes)]) +
        '</div>' if classes else ""
    )
    functions_result = (
        f'<div style="color: orange;">functions:\n' +
        "\n".join([f"  {i+1}. {func}" for i, func in enumerate(functions)]) +
        '</div>' if functions else ""
    )

    return functions_result, classes_result

def parse_main_block(file_path):
    main_block = []
    main_pattern = re.compile(r'if __name__ == ["\']__main__["\']:')
    with open(file_path, "r") as file:
        lines = file.readlines()

    capturing = False
    for line in lines:
        if main_pattern.match(line.strip()):
            capturing = True
            continue
        if capturing:
            if line.strip():  # Only capture non-empty lines
                main_block.append(f"  {line.strip()}")  # Add two spaces for indentation

    if main_block:
        return f'<div style="color: red;">main block:\n' + "\n".join(main_block) + '</div>'
    else:
        return ""  # Return an empty string if no main block is found

def parse_routes(file_path):
    routes = []
    route_pattern = re.compile(r"@(router\.(get|post|patch|delete)\(['\"](.*?)['\"]\))")

    with open(file_path, "r") as file:
        lines = file.readlines()

    for line in lines:
        line = line.strip()
        match = route_pattern.search(line)
        if match:
            route_method = match.group(2).upper()
            route_path = match.group(3)
            routes.append(f"{route_method}: {route_path}")

    if routes:
        return f'<div style="color: teal;">routes:\n' + "\n".join([f"  {i+1}. {route}" for i, route in enumerate(routes)]) + '</div>'
    else:
        return ""  # Return an empty string if no routes are found

def write_to_markdown(file_path, content):
    """Write content to a Markdown file."""
    with open(file_path, "w") as md_file:
        md_file.write(content)

def append_tree_structure(root_folder, markdown_lines):
    """Append a tree structure of the directory to the Markdown file, prioritizing Python files and excluding unnecessary files."""
    def build_tree(path, prefix=""):
        items = sorted(
            [item for item in os.listdir(path) if item not in ["venv", "static"] and not item.endswith((".md", "poetry.lock", "pyproject.toml"))],
            key=lambda x: (os.path.isdir(os.path.join(path, x)), x.lower())  # Sort files first, then directories
        )
        tree_lines = []
        for index, item in enumerate(items):
            item_path = os.path.join(path, item)
            connector = "└── " if index == len(items) - 1 else "├── "
            # Highlight only `.py` files
            if item.endswith(".py"):
                tree_lines.append(f'{prefix}{connector}<span style="color: yellow;">{item}</span>')
            else:
                tree_lines.append(f'{prefix}{connector}<span style="color: white;">{item}</span>')
            if os.path.isdir(item_path):
                tree_lines.extend(build_tree(item_path, prefix + ("    " if index == len(items) - 1 else "│   ")))
        return tree_lines

    try:
        tree_structure = "\n".join(build_tree(root_folder))
        markdown_lines.insert(0, f'# {os.path.basename(root_folder)} tree')
        markdown_lines.insert(1, f'<pre style="color: white;">{tree_structure}</pre>')
    except Exception as e:
        print(f"{Fore.RED}Error generating tree structure: {e}{Style.RESET_ALL}")

def process_file(file_path, root_folder, markdown_lines):
    """Process a single Python file and add its analysis results to Markdown."""
    print(f"{Style.BRIGHT}Processing file: {file_path}{Style.RESET_ALL}\n")

    # Get the relative path
    relative_path = os.path.relpath(file_path, root_folder)
    markdown_lines.append(f"# `/{relative_path}`\n")
    markdown_lines.append("<pre>")

    # Parse and append non-empty results
    for parse_function in [parse_imports, parse_environment_variables, parse_functions_and_classes, parse_main_block, parse_routes]:
        result = parse_function(file_path)
        if isinstance(result, tuple):  # Handle functions and classes separately
            for res in result:
                if res.strip():  # Only append non-empty sections
                    markdown_lines.append(res.strip())
        elif result.strip():  # For other sections
            markdown_lines.append(result.strip())

    markdown_lines.append("</pre>")
    markdown_lines.append("")  # Add a blank line between files

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(f"{Fore.RED}Usage: python kryptonite.py <folder_path>{Style.RESET_ALL}")
        sys.exit(1)

    folder_path = sys.argv[1]

    if not os.path.isdir(folder_path):
        print(f"{Fore.RED}Error: {folder_path} is not a valid directory.{Style.RESET_ALL}")
        sys.exit(1)

    markdown_lines = []

    # Append tree structure to the Markdown file
    append_tree_structure(folder_path, markdown_lines)

    # Iterate over all Python files in the folder
    # Iterate over all Python files in the folder
    for root, dirs, files in os.walk(folder_path):
        # Skip the 'venv' directory
        dirs[:] = [d for d in dirs if d != "venv"]
        for file in files:
            if file.endswith(".py"):
                file_path = os.path.join(root, file)
                process_file(file_path, folder_path, markdown_lines)

    # Write results to a Markdown file
    # markdown_file_path = os.path.join(folder_path, f"kryptonite_" + os.path.basename(folder_path) + ".md")
    out_dir = "krypt"
    os.makedirs(out_dir, exist_ok=True)
    markdown_file_path = os.path.join(out_dir, os.path.basename(os.path.normpath(folder_path)) + ".md")
    write_to_markdown(markdown_file_path, "\n".join(markdown_lines))
    print(f"{Fore.YELLOW}Markdown file created at: {markdown_file_path}{Style.RESET_ALL}")
