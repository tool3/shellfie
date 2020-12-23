export type ShellfieTheme = {
    theme: {
        background: string ='#151515';
    };
};

export type ShellfieStyle = {
    fontFamily: string;
    fontColor: string;
    fontWeight: string;
    fontSize: number;  
};

export type ShellfieViewport = {
    width: number;
    height: number;
};

export type ShellfieOptions = {
    name: string,
    location?: string,
    theme?: ShellfieTheme,
    style?: ShellfieStyle,
    viewport?: ShellfieViewport,
    puppeteerArgs?: string[]
};

export default function shellfie(data: string | string[], options: ShellfieOptions): Promise<void>;