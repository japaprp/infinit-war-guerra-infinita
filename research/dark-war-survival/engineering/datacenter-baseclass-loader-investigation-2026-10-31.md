# DataCenter bundle and BaseClass loader investigation — 2026-10-31

## Result

**PASS — source bundle ownership verified. BLOCKED — central BaseClass/DataCenter registration implementation not located.**

The previous search was too narrow: the local AssetBundle-wrapper export contains a complete family of DataCenter bundles, including the exact HeroLevelUpTemplateManager module in both Lua generations.

## 1. Physical module ownership and integrity

The wrapper-exported asset path is:

`Assets/Main/LuaTxt/DataCenter/HeroLevelUpTemplateManager/HeroLevelUpTemplateManager.bytes`

Lua 5.4:
- Bundle family: `lua_scripts_datacenter_h`
- Extracted file SHA-256: `9B1FF70670B820BB4FC3F59CD10ADBB8A397EE3E8EFAB3F1811FC35BE9652B42`
- The hash exactly matches the previously analyzed `validation-staging/hero-level-up-template-54/HeroLevelUpTemplateManager.bytes`.

Lua 5.5:
- Bundle family: `lua_scripts_datacenter_55_h`
- Asset path: `Assets/Main/LuaTxt_55/DataCenter/HeroLevelUpTemplateManager/HeroLevelUpTemplateManager.bytes`
- Extracted file SHA-256: `1E9E37CA404E97D3E387855F1B40ECA102EB2AD5D6412B939D46BE496F78A72C`
- The hash exactly matches the previously analyzed `validation-staging/hero-level-up-template-55/HeroLevelUpTemplateManager.bytes`.

This independently confirms the analyzed manager bytecode came from the DataCenter bundle family. It does **not** establish how the runtime registers the class.

## 2. DataCenter family static scan

Scanned 1,250 extracted `.bytes` assets across 12 local `lua_scripts_datacenter*` wrapper-export directories.

- 1,167 assets contain the literal `BaseClass`, consistent with widespread class-factory calls.
- No implementation pattern was found for `function BaseClass`, `BaseClass =`, `_G.BaseClass`, or `rawset(_G, "BaseClass", ...)`.
- No explicit DataCenter table initialization pattern was found for `DataCenter = {}`, `_G.DataCenter`, or `rawset(_G, "DataCenter", ...)`.
- No direct `DataCenter.HeroLevelUpTemplateManager` assignment was found in this family.
- The wrapper-export directories contain no assembly DLLs; the local analysis collection currently has zero `.dll` files.

These are bounded negative findings for the scanned DataCenter bundle family and local collection, not proof that the runtime implementation does not exist. The factory or registration may be supplied by a Lua bootstrap bundle outside this family or by managed Unity/C# integration that is not present in the current local collection.

## 3. What is and is not established

- **PASS:** `HeroLevelUpTemplateManager.bytes` is physically present in both DataCenter bundle-family exports.
- **PASS:** both extracted module hashes match the existing analysis inputs exactly.
- **PASS:** the class root calls `BaseClass("HeroLevelUpTemplateManager")` and defines the expected methods.
- **BLOCKED:** implementation of `BaseClass` was not found in the scanned DataCenter assets.
- **BLOCKED:** explicit publication of this class into the main `DataCenter` table was not found.
- **NOT RUN:** runtime instrumentation or dynamic observation of class registration.

## 4. RAM and DataTable extraction gate

Latest measured free RAM: **546.1 MB** of approximately 3.68 GB. Required threshold: **875 MB**. One AssetRipper process remains active.

The original `heroes_levelup` DataTable bundles are not present in the current local selected-bundle files:
- Lua 5.4 bundle: `datatable_config_luatxt_h_6a1d2a950c996f15a938acebcebc598b.bundle`
- Lua 5.5 bundle: `datatable_config_luatxt_55_h_3241e39d538fe22e815569b43561d206.bundle`

The manifest marks the two `aps_new_heroes` bundles as cached on the S21, but their physical analysis remains deferred until after the requested `heroes_levelup` base/Lua 5.5 sequence.

**BLOCKED:** do not load or export any new bundle until free RAM is at least 875 MB. No bundle was loaded during this investigation.

## 5. Next steps

1. Continue locating the Lua bootstrap/runtime binding that provides `BaseClass` and initializes or populates `DataCenter`. Expand beyond the DataCenter family only through existing lightweight manifests and extracted files; inspect managed Unity artifacts only if they are actually available.
2. Recheck free RAM. Do not start AssetRipper extraction before the 875 MB threshold.
3. Acquire/extract `heroes_levelup` base, hash it, and inspect its schema and records.
4. Extract the Lua 5.5 `heroes_levelup` counterpart and compare IDs, costs, attributes, and requirements.
5. Then inspect `aps_new_heroes` and its relevant B variant physically.
6. Consolidate complete progression rules only after the physical DataTables are verified.

No original files were modified. No merge, deployment, publication, deletion, or secret/permission change occurred.
