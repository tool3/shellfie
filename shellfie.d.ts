declare type ShellfieTheme = {
    background: string;
    foreground: string;
};

declare type ShellfieStyle = {
    fontFamily: string;
    fontWeight: string;
    fontSize: number;
};

declare type ShellfieViewport = {
    width: number;
    height: number;
};

declare type ShellfieOptions = {
    name?: string;
    location?: string;
    theme?: ShellfieTheme;
    style?: ShellfieStyle;
    viewport?: ShellfieViewport;
    mode?: string;
    puppeteerOptions?: Record<string, any>;
};

declare function shellfie(data: string | string[], options: ShellfieOptions): Promise<void>;

export = shellfie;