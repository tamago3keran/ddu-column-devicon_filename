import {
  BaseColumn,
  DduItem,
  ItemHighlight
} from "https://deno.land/x/ddu_vim@v2.8.3/types.ts";
import { GetTextResult } from "https://deno.land/x/ddu_vim@v2.8.3/base/column.ts";
import { Denops, fn } from "https://deno.land/x/ddu_vim@v2.8.3/deps.ts";
import { basename } from "https://deno.land/std@0.185.0/path/mod.ts";
import { getDevicon, setDeviconColor } from "./devicon_data.ts";

type Params = {
  collapsedIcon: string;
  expandedIcon: string;
  iconWidth: number;
  linkIcon: string;
  highlights: HighlightGroup;
  indentationWidth: number;
  fileIconColor?: string;
  directoryIconColor?: string;
};

type HighlightGroup = {
  directoryIcon?: string;
  directoryName?: string;
  linkIcon?: string;
  linkName?: string;
};

type ActionData = {
  isDirectory?: boolean;
  isLink?: boolean;
  path?: string;
};

export class Column extends BaseColumn<Params> {
  override async getLength(args: {
    denops: Denops;
    columnParams: Params;
    items: DduItem[];
  }): Promise<number> {
    const {denops, columnParams, items} = args;
    const {indentationWidth, iconWidth} = columnParams;

    const widths = await Promise.all(items.map(
      async (item) => {
        const action = item?.action as ActionData;
        const isLink = action.isLink ?? false;
        const isDirectory = item.isTree ?? false;
        const indentation = this.getIndentation({level: item.__level, indentationWidth: indentationWidth});
        let path = basename(action.path ?? item.word) + (isDirectory ? "/" : "");

        if (isLink && action.path) {
          path += ` -> ${await Deno.realPath(action.path)}`;
        }

        const length = indentation + 1 + (await fn.strwidth(
          denops,
          iconWidth + path,
        ) as number);

        return length;
      },
    )) as number[];
    return Math.max(...widths);
  }

  override async getText(args: {
    denops: Denops;
    columnParams: Params;
    startCol: number;
    endCol: number;
    item: DduItem;
  }): Promise<GetTextResult> {
    const {denops, columnParams, startCol, endCol, item} = args;
    const {collapsedIcon, expandedIcon, iconWidth, linkIcon, highlights, indentationWidth, fileIconColor, directoryIconColor} = columnParams;

    const action = item?.action as ActionData;
    const itemHighlights: ItemHighlight[] = [];
    const isDirectory = item.isTree ?? false;
    const isLink = action.isLink ?? false;
    const path = basename(action.path ?? item.word) + (isDirectory ? "/" : "");
    const indentation = this.getIndentation({level: item.__level, indentationWidth: indentationWidth});

    if (isDirectory) {
      const userHighlights = highlights;
      itemHighlights.push({
        name: "ddu_column_devicon_filename_directory_icon",
        "hl_group": userHighlights.directoryIcon ?? "ddu_column_devicon_filename_directory_icon",
        col: startCol + indentation,
        width: iconWidth,
      });

      itemHighlights.push({
        name: "column-filename-directory-name",
        "hl_group": userHighlights.directoryName ?? "Directory",
        col: startCol + indentation + iconWidth + 1,
        width: path.length,
      });
    } else if (isLink) {
      const userHighlights = highlights;
      itemHighlights.push({
        name: "ddu_column_devicon_filename_link_icon",
        "hl_group": userHighlights.linkIcon ?? "ddu_column_devicon_filename_link_icon",
        col: startCol + indentation,
        width: iconWidth,
      });

      itemHighlights.push({
        name: "column-filename-link-name",
        "hl_group": userHighlights.linkName ?? "Comment",
        col: startCol + indentation + iconWidth + 1,
        width: path.length,
      });
    }

    const directoryIcon = item.__expanded
      ? expandedIcon
      : collapsedIcon;
    const icon = isDirectory
      ? directoryIcon
      : isLink
      ? linkIcon
      : getDevicon({ fileName: path });
    const text = " ".repeat(indentation) + icon + " " + path;
    const width = await fn.strwidth(denops, text) as number;
    const padding = " ".repeat(endCol - startCol - width);

    if (!isDirectory && !isLink) {
      setDeviconColor({
        denops: denops,
        fileName: path,
        highlights: itemHighlights,
        col: startCol + indentation,
        width: iconWidth,
        color: fileIconColor,
      });
    }

    this.addHighlightGroup({
      denops: denops,
      directoryIconColor: directoryIconColor
    })

    return Promise.resolve({
      text: text + padding,
      highlights: itemHighlights,
    });
  }

  override params(): Params {
    return {
      collapsedIcon: "",
      expandedIcon: "",
      iconWidth: 3,
      linkIcon: "@",
      highlights: {},
      indentationWidth: 1,
      fileIconColor: null,
      directoryIconColor: null,
    };
  }

  private getIndentation = (args: {
    level: number;
    indentationWidth: number;
  }): number => {
    const {level, indentationWidth} = args;
    return level * indentationWidth;
  }

  private addHighlightGroup = (args: {
    denops: Denops;
    directoryIconColor: string;
  }): void => {
    const {denops, directoryIconColor} = args;
    if (directoryIconColor) denops.cmd(`hi default ddu_column_devicon_filename_directory_icon guifg=${directoryIconColor}`);
  }
}
