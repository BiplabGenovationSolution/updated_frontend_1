import sys

def check_tags(file_path):
    with open(file_path, 'r') as f:
        lines = f.readlines()
    
    stack = []
    for i, line in enumerate(lines, 1):
        # Very naive check for common tags
        if '<div' in line and '/>' not in line:
            stack.append(('div', i))
        if '</div>' in line:
            if not stack or stack[-1][0] != 'div':
                print(f"Extra </div> at line {i}")
            else:
                stack.pop()
    
    for tag, line in stack:
        print(f"Unclosed <{tag}> at line {line}")

if __name__ == "__main__":
    check_tags(sys.argv[1])
