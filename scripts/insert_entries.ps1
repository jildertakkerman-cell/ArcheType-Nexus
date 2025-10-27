$entries = Get-Content "entries.txt" -Raw
$content = Get-Content "c:\Users\jilde\Documents\VSCode-Projects-main\Apps\ArcheType Nexus\assets\js\archetypes-data.js" -Raw
$oldEnd = @"
<text x="50" y="57" text-anchor="middle" font-size="12" fill="#000" font-weight="bold">SHADDOL</text>
</svg>`
            }
        ];

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = archetypes;
}
"@
$newEnd = @"
<text x="50" y="57" text-anchor="middle" font-size="12" fill="#000" font-weight="bold">SHADDOL</text>
</svg>`
            }
$entries        ];

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = archetypes;
}
"@
$content = $content -replace [regex]::Escape($oldEnd), $newEnd
Set-Content "c:\Users\jilde\Documents\VSCode-Projects-main\Apps\ArcheType Nexus\assets\js\archetypes-data.js" $content