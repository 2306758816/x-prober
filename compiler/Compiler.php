<?php

namespace InnStudio\Compiler;

class Compiler
{
    private $baseDir         = '';
    private $compileFilePath = '';

    public function __construct(string $dir)
    {
        $this->baseDir         = "{$dir}/src";
        $this->compileFilePath = "{$dir}/dist/prober.php";

        // lang
        $this->languageGeneration($dir);

        echo "Compile starting...\n";

        $code = '';

        foreach ($this->yieldFiles($this->baseDir) as $filePath) {
            if (\is_dir($filePath) || false === \strpos($filePath, '.php')) {
                continue;
            }

            $content = $this->getCodeViaFilePath($filePath);
            $code .= $content;
        }

        $preDefineCode = $this->preDefine(array(
            $this->getTimerCode(),
            $this->getDebugCode(),
            $this->getLangLoaderCode(),
        ));
        $code = "<?php\n{$preDefineCode}\n{$code}";
        $code .= $this->loader();
        $code = \preg_replace("/(\r|\n)+/", "\n", $code);

        if (true === $this->writeFile($code)) {
            echo 'Compiled!';
        } else {
            echo 'Failed.';
        }
    }

    private function languageGeneration(string $dir): void
    {
        echo "Generating I18n language pack...\n";

        $langGen = new LanguageGeneration("{$dir}/languages");
        $status  = $langGen->writeJsonFile("{$dir}/src/I18n/Lang.json");

        if ( ! $status) {
            die("Error: can not generate languages.\n");
        }

        echo "Generated I18n...\n";
    }

    private function getCodeViaFilePath(string $filePath): string
    {
        $code = '';

        echo "Packing `{$filePath}...";

        if (true === $this->isDev()) {
            $code = \file_get_contents($filePath);
        } else {
            $code     = \php_strip_whitespace($filePath);
            $lines    = \explode("\n", $code);
            $lineCode = array();

            foreach ($lines as $line) {
                $lineStr = \trim($line);

                if ($lineStr) {
                    $lineCode[] = $lineStr;
                }
            }

            $code = \implode("\n", $lineCode);
        }

        $code = \trim($code, "\n");

        echo "OK\n";

        return $code ? \substr($code, 5) : $code;
    }

    private function isDev(): bool
    {
        global $argv;

        return \in_array('dev', $argv);
    }

    private function preDefine(array $code): string
    {
        $codeStr = \implode("\n", $code);

        return <<<EOT
namespace InnStudio\Prober\PreDefine;
{$codeStr}
EOT;
    }

    private function getTimerCode(): string
    {
        return <<<EOT
\define('TIMER', \microtime(true));
EOT;
    }

    private function getDebugCode(): string
    {
        $debug = $this->isDev() ? 'true' : 'false';

        return <<<EOT
\define('DEBUG', {$debug});
EOT;
    }

    private function getLangLoaderCode(): string
    {
        $filePath = $this->baseDir . '/I18n/Lang.json';

        if ( ! \is_readable($filePath)) {
            die('Language is missing.');
        }

        $lines = \file($filePath);

        $lines = \array_map(function ($line) {
            return 0 === \strpos(\trim($line), '// ') ? '' : $line;
        }, $lines);

        $json = \implode('', $lines);
        $json = \json_decode($json, true);

        if ( ! $json) {
            die('Invalid json format.');
        }

        $json = \base64_encode(\json_encode($json));
        $json = <<<EOT
\define('LANG', '{$json}');
EOT;

        return $json;
    }

    private function loader(): string
    {
        $dirs = \glob($this->baseDir . '/*');

        if ( ! $dirs) {
            return '';
        }

        $files = array();

        foreach ($dirs as $dir) {
            $basename = \basename($dir);
            $filePath = "{$dir}/{$basename}.php";

            if ( ! \is_file($filePath)) {
                continue;
            }

            if ('Entry' === $basename) {
                continue;
            }

            $files[] = "new \\InnStudio\\Prober\\{$basename}\\{$basename}();";
        }

        $files[] = 'new \\InnStudio\\Prober\\Entry\\Entry();';

        return \implode("\n", $files);
    }

    private function yieldFiles(string $dir): \Iterator
    {
        if (\is_dir($dir)) {
            $dh = \opendir($dir);

            if ( ! $dh) {
                yield false;
            }

            while (false !== ($file = \readdir($dh))) {
                if ('.' === $file || '..' === $file) {
                    continue;
                }

                $filePath = "{$dir}/{$file}";

                if (\is_dir($filePath)) {
                    foreach (self::yieldFiles($filePath) as $yieldFilepath) {
                        yield $yieldFilepath;
                    }
                } else {
                    yield $filePath;
                }
            }

            \closedir($dh);
        }

        yield $dir;
    }

    private function writeFile(string $data): bool
    {
        $dir = \dirname($this->compileFilePath);

        if ( ! \is_dir($dir)) {
            \mkdir($dir, 0755, true);
        }

        return (bool) \file_put_contents($this->compileFilePath, $data);
    }
}
