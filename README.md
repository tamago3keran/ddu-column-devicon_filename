# ddu-column-devicon_filename
Filename with devicon column for ddu.vim

## Required

### denops.vim

https://github.com/vim-denops/denops.vim

### ddu.vim

https://github.com/Shougo/ddu.vim

### nvim-web-devicons

https://github.com/nvim-tree/nvim-web-devicons

## Configuration

```vim
call ddu#custom#patch_global(#{
    \   columns: ['devicon_filename'],
    \ })
```
