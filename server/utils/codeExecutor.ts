import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const DEFAULT_TIMEOUT_MS = parseInt(process.env.CODE_TIMEOUT_MS || '7000', 10);

const runProcess = (
  command: string,
  args: string[],
  options: { cwd?: string; input?: string; timeoutMs?: number } = {}
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: options.cwd, shell: false });

    let stdout = '';
    let stderr = '';

    const onDataOut = (data: any) => {
      stdout += data.toString();
    };
    const onDataErr = (data: any) => {
      stderr += data.toString();
    };

    child.stdout.on('data', onDataOut);
    child.stderr.on('data', onDataErr);

    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      try { child.kill('SIGKILL'); } catch {}
    }, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

    child.on('close', (code) => {
      clearTimeout(timeout);
      if (timedOut) {
        return reject(new Error('Time Limit Exceeded'));
      }
      if (code !== 0) {
        return reject(new Error(stderr || `Process exited with code ${code}`));
      }
      resolve(stdout);
    });

    if (options.input) {
      child.stdin.write(options.input);
    }
    child.stdin.end();
  });
};

export const executeCode = async (language: string, code: string, input: string): Promise<string> => {
  // Support ESM where __dirname is not defined
  const __filename = fileURLToPath(import.meta.url);
  const __dirname_es = path.dirname(__filename);
  const tempDir = path.join(__dirname_es, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const fileExtension = getFileExtension(language);
  const fileName = `Main_${Date.now()}`;
  const filePath = path.join(tempDir, `${fileName}.${fileExtension}`);

  // For scripting languages, append a small harness to call a student's function
  const buildHarnessedCode = (lang: string, userCode: string): string => {
    if (lang === 'javascript') {
      const harness = `\n\n// Auto-harness appended\nlet __input__ = '';\nprocess.stdin.on('data', (c) => { __input__ += c.toString(); });\nprocess.stdin.on('end', async () => {\n  const format = (v) => { try { return typeof v === 'string' ? v : JSON.stringify(v); } catch { return String(v); } };\n  try {\n    let fn = undefined;\n    if (typeof solution === 'function') fn = solution;\n    else if (typeof main === 'function') fn = main;\n    if (fn) {\n      const out = fn(__input__);\n      if (out && typeof out.then === 'function') {\n        out.then(v => { console.log(format(v)); }).catch(e => { console.error((e && e.message) || 'Execution error'); process.exit(1); });\n      } else {\n        console.log(format(out));\n      }\n    } else {\n      // No function detected, just echo input to avoid empty output\n      console.log(__input__);\n    }\n  } catch (e) {\n    const msg = (e && e.message) ? e.message : 'Execution error';\n    console.error(msg);\n    process.exit(1);\n  }\n});\nprocess.stdin.resume();\n`;
      return userCode + harness;
    }
    if (lang === 'python') {
      const harness = `\n\n# Auto-harness appended\nimport sys, json\n__input__ = sys.stdin.read()\n\n_def_tried = False\nfor name in ['solution','main']:\n    if name in globals() and callable(globals()[name]):\n        try:\n            _res = globals()[name](__input__)\n            try:\n                if isinstance(_res, (dict, list)):\n                    print(json.dumps(_res))\n                else:\n                    print(_res)\n            except Exception:\n                print(_res)\n        except Exception as e:\n            print(str(e), file=sys.stderr)\n            sys.exit(1)\n        _def_tried = True\n        break\n\nif not _def_tried:\n    # No known function found, echo input to avoid empty output\n    print(__input__)\n`;
      return userCode + harness;
    }
    return userCode;
  };

  const codeToWrite = buildHarnessedCode(language, code);
  fs.writeFileSync(filePath, codeToWrite);

  try {
    if (language === 'javascript') {
      return await runProcess('node', [filePath], { input });
    }
    if (language === 'python') {
      try {
        return await runProcess('python', [filePath], { input });
      } catch (e) {
        return await runProcess('python3', [filePath], { input });
      }
    }
    if (language === 'cpp') {
      const exePath = path.join(tempDir, fileName + (process.platform === 'win32' ? '.exe' : ''));
      await runProcess('g++', [filePath, '-O2', '-std=c++17', '-o', exePath]);
      return await runProcess(exePath, [], { input });
    }
    if (language === 'java') {
      // Requires user's main class name to match fileName or be in the same file
      await runProcess('javac', [filePath]);
      return await runProcess('java', ['-cp', tempDir, fileName], { input });
    }
    throw new Error(`Unsupported language: ${language}`);
  } catch (error: any) {
    throw new Error(error?.message || 'Execution failed');
  } finally {
    fs.unlinkSync(filePath);
    if (language === 'cpp' || language === 'java') {
      const executablePath = path.join(tempDir, fileName);
      if (fs.existsSync(executablePath)) {
        fs.unlinkSync(executablePath);
      }
      if (language === 'java') {
        const classPath = path.join(tempDir, `${fileName}.class`);
        if (fs.existsSync(classPath)) {
          fs.unlinkSync(classPath);
        }
      }
    }
  }
};

const getFileExtension = (language: string): string => {
  switch (language) {
    case 'javascript':
      return 'js';
    case 'python':
      return 'py';
    case 'java':
      return 'java';
    case 'cpp':
      return 'cpp';
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
};
