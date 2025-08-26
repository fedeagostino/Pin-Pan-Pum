import { Team, FormationLayout } from './types';
import { BOARD_WIDTH, BOARD_HEIGHT, PAWN_PUCK_RADIUS } from './constants';

const RED_Y_BASE = BOARD_HEIGHT * 0.85;
const RED_Y_MID = BOARD_HEIGHT * 0.80;
const RED_Y_FRONT = BOARD_HEIGHT * 0.75;

const BLUE_Y_BASE = BOARD_HEIGHT * 0.15;
const BLUE_Y_MID = BOARD_HEIGHT * 0.20;
const BLUE_Y_FRONT = BOARD_HEIGHT * 0.25;

const createTeamFormations = (team: Team): FormationLayout[] => {
    const yBase = team === 'RED' ? RED_Y_BASE : BLUE_Y_BASE;
    const yMid = team === 'RED' ? RED_Y_MID : BLUE_Y_MID;
    const yFront = team === 'RED' ? RED_Y_FRONT : BLUE_Y_FRONT;

    return [
        { // Muro de Acero
            name: "Muro de Acero",
            puckLayout: [
                { position: { x: BOARD_WIDTH * 0.2, y: yBase } },
                { position: { x: BOARD_WIDTH * 0.5, y: yBase } },
                { position: { x: BOARD_WIDTH * 0.8, y: yBase } },
                { position: { x: BOARD_WIDTH * 0.35, y: yMid } },
                { position: { x: BOARD_WIDTH * 0.65, y: yMid } },
                { position: { x: BOARD_WIDTH * 0.2, y: yFront } },
                { position: { x: BOARD_WIDTH * 0.8, y: yFront } },
            ]
        },
        { // Flecha Ofensiva
            name: "Flecha Ofensiva",
            puckLayout: [
                { position: { x: BOARD_WIDTH * 0.5, y: yFront } },
                { position: { x: BOARD_WIDTH * 0.35, y: yMid } },
                { position: { x: BOARD_WIDTH * 0.65, y: yMid } },
                { position: { x: BOARD_WIDTH * 0.2, y: yBase } },
                { position: { x: BOARD_WIDTH * 0.8, y: yBase } },
                { position: { x: BOARD_WIDTH * 0.5, y: yBase } },
                { position: { x: BOARD_WIDTH * 0.2, y: yMid } },
            ]
        },
        { // Flanco
            name: "Flanco",
            puckLayout: [
                { position: { x: BOARD_WIDTH * 0.15, y: yBase } },
                { position: { x: BOARD_WIDTH * 0.85, y: yBase } },
                { position: { x: BOARD_WIDTH * 0.15, y: yMid } },
                { position: { x: BOARD_WIDTH * 0.85, y: yMid } },
                { position: { x: BOARD_WIDTH * 0.15, y: yFront } },
                { position: { x: BOARD_WIDTH * 0.85, y: yFront } },
                { position: { x: BOARD_WIDTH * 0.5, y: yBase } },
            ]
        },
        { // Balanceada
            name: "Balanceada",
            puckLayout: [
                { position: { x: BOARD_WIDTH * 0.25, y: yBase } },
                { position: { x: BOARD_WIDTH * 0.75, y: yBase } },
                { position: { x: BOARD_WIDTH * 0.5, y: yMid } },
                { position: { x: BOARD_WIDTH * 0.2, y: yMid } },
                { position: { x: BOARD_WIDTH * 0.8, y: yMid } },
                { position: { x: BOARD_WIDTH * 0.35, y: yFront } },
                { position: { x: BOARD_WIDTH * 0.65, y: yFront } },
            ]
        },
        { // Trampa
            name: "Trampa",
            puckLayout: [
                { position: { x: BOARD_WIDTH * 0.1, y: yFront } },
                { position: { x: BOARD_WIDTH * 0.9, y: yFront } },
                { position: { x: BOARD_WIDTH * 0.3, y: yMid } },
                { position: { x: BOARD_WIDTH * 0.7, y: yMid } },
                { position: { x: BOARD_WIDTH * 0.5, y: yBase } },
                { position: { x: BOARD_WIDTH * 0.2, y: yBase } },
                { position: { x: BOARD_WIDTH * 0.8, y: yBase } },
            ]
        },
    ];
};

export const FORMATIONS: { [key in Team]: FormationLayout[] } = {
    RED: createTeamFormations('RED'),
    BLUE: createTeamFormations('BLUE'),
};

export type PawnFormationLayout = {
    name: string;
    puckLayout: { position: { x: number, y: number } }[]; // Array of 5 positions
};

const createTeamPawnFormations = (team: Team): PawnFormationLayout[] => {
    const yPawnBase = team === 'RED' ? BOARD_HEIGHT * 0.65 : BOARD_HEIGHT * 0.35;
    const yPawnMid = team === 'RED' ? yPawnBase - 30 : yPawnBase + 30;
    const yPawnFront = team === 'RED' ? yPawnBase - 60 : yPawnBase + 60;

    return [
        {
            name: "Línea Estándar",
            puckLayout: [
                { position: { x: BOARD_WIDTH * 0.15, y: yPawnBase } },
                { position: { x: BOARD_WIDTH * 0.325, y: yPawnBase } },
                { position: { x: BOARD_WIDTH * 0.5, y: yPawnBase } },
                { position: { x: BOARD_WIDTH * 0.675, y: yPawnBase } },
                { position: { x: BOARD_WIDTH * 0.85, y: yPawnBase } },
            ]
        },
        {
            name: "Cuña Defensiva",
            puckLayout: [
                { position: { x: BOARD_WIDTH * 0.5, y: yPawnBase } },
                { position: { x: BOARD_WIDTH * 0.35, y: yPawnMid } },
                { position: { x: BOARD_WIDTH * 0.65, y: yPawnMid } },
                { position: { x: BOARD_WIDTH * 0.2, y: yPawnFront } },
                { position: { x: BOARD_WIDTH * 0.8, y: yPawnFront } },
            ]
        },
        {
            name: "Punta de Lanza",
            puckLayout: [
                { position: { x: BOARD_WIDTH * 0.5, y: yPawnFront } },
                { position: { x: BOARD_WIDTH * 0.35, y: yPawnMid } },
                { position: { x: BOARD_WIDTH * 0.65, y: yPawnMid } },
                { position: { x: BOARD_WIDTH * 0.2, y: yPawnBase } },
                { position: { x: BOARD_WIDTH * 0.8, y: yPawnBase } },
            ]
        },
        {
            name: "Defensa Escalonada",
            puckLayout: [
                { position: { x: BOARD_WIDTH * 0.15, y: yPawnBase } },
                { position: { x: BOARD_WIDTH * 0.85, y: yPawnBase } },
                { position: { x: BOARD_WIDTH * 0.35, y: yPawnMid } },
                { position: { x: BOARD_WIDTH * 0.65, y: yPawnMid } },
                { position: { x: BOARD_WIDTH * 0.5, y: yPawnFront } },
            ]
        }
    ];
};

export const PAWN_FORMATIONS: { [key in Team]: PawnFormationLayout[] } = {
    RED: createTeamPawnFormations('RED'),
    BLUE: createTeamPawnFormations('BLUE'),
};

export type StrategicPlan = {
    name: string;
    specialFormation: FormationLayout;
    pawnFormation: PawnFormationLayout;
};

const createStrategicPlans = (team: Team): StrategicPlan[] => {
    const specialFormations = FORMATIONS[team];
    const pawnFormations = PAWN_FORMATIONS[team];
    
    return [
        {
            name: "Asalto Equilibrado",
            specialFormation: specialFormations.find(f => f.name === "Balanceada")!,
            pawnFormation: pawnFormations.find(f => f.name === "Línea Estándar")!,
        },
        {
            name: "Fortaleza Central",
            specialFormation: specialFormations.find(f => f.name === "Muro de Acero")!,
            pawnFormation: pawnFormations.find(f => f.name === "Cuña Defensiva")!,
        },
        {
            name: "Ataque en Cuña",
            specialFormation: specialFormations.find(f => f.name === "Flecha Ofensiva")!,
            pawnFormation: pawnFormations.find(f => f.name === "Punta de Lanza")!,
        },
        {
            name: "Guerra de Flancos",
            specialFormation: specialFormations.find(f => f.name === "Flanco")!,
            pawnFormation: pawnFormations.find(f => f.name === "Defensa Escalonada")!,
        }
    ];
};

export const STRATEGIC_PLANS: { [key in Team]: StrategicPlan[] } = {
    RED: createStrategicPlans('RED'),
    BLUE: createStrategicPlans('BLUE'),
};