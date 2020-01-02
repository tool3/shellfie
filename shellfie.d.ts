export type ShellfieTheme = {
    theme: {
        background: string;
        foreground: string;
    };
};

export type ShellfieStyle = {
    fontFamily: string;
    fontWeight: string;
    fontSize: number;  
};

export type ShellfieViewport = {
    width: number;
    height: number;
};

export type ShellfieOptions = {
    name?: string;
    location?: string;
    theme?: ShellfieTheme;
    style?: ShellfieStyle;
    viewport?: ShellfieViewport;
    mode?: string;
    puppeteerArgs?: string[];
};

export default function shellfie(data: string | string[], options: ShellfieOptions): Promise<void>;