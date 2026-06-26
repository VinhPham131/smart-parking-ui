export interface VehicleBrand {
    label: string
    logo: string
}

export const VEHICLE_BRANDS: VehicleBrand[] = [
    {
        label: 'Honda',
        logo: '/brand_logo/honda.png',
    },
    {
        label: 'Yamaha',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Yamaha_logo.svg',
    },
    {
        label: 'Suzuki',
        logo: '/brand_logo/suzuki.png',
    },
    {
        label: 'Toyota',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_logo.svg',
    },
    {
        label: 'Ford',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Ford_logo_flat.svg',
    },
]

export const getVehicleBrand = (brand?: string) =>
    VEHICLE_BRANDS.find((b) => b.label === brand)