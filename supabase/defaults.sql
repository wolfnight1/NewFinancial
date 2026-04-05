DO $$
DECLARE
    house_record RECORD;
BEGIN
    FOR house_record IN SELECT id FROM public.households LOOP
        -- Extras
        INSERT INTO public.category_groups (household_id, name, color, budget_limit)
        VALUES (house_record.id, 'Extras', '#9C27B0', 100)
        ON CONFLICT (household_id, name) DO UPDATE 
        SET budget_limit = 100;

        -- Servicios / Utilities
        INSERT INTO public.category_groups (household_id, name, color, budget_limit)
        VALUES (house_record.id, 'Servicios / Utilities', '#2196F3', 450)
        ON CONFLICT (household_id, name) DO UPDATE 
        SET budget_limit = 450;

        -- Gasolina
        INSERT INTO public.category_groups (household_id, name, color, budget_limit)
        VALUES (house_record.id, 'Gasolina', '#FF9800', 150)
        ON CONFLICT (household_id, name) DO UPDATE 
        SET budget_limit = 150;

        -- Mercado
        INSERT INTO public.category_groups (household_id, name, color, budget_limit)
        VALUES (house_record.id, 'Mercado', '#4CAF50', 750)
        ON CONFLICT (household_id, name) DO UPDATE 
        SET budget_limit = 750;

        -- Salidas
        INSERT INTO public.category_groups (household_id, name, color, budget_limit)
        VALUES (house_record.id, 'Salidas', '#E91E63', 600)
        ON CONFLICT (household_id, name) DO UPDATE 
        SET budget_limit = 600;

        -- Transporte
        INSERT INTO public.category_groups (household_id, name, color, budget_limit)
        VALUES (house_record.id, 'Transporte', '#00BCD4', 400)
        ON CONFLICT (household_id, name) DO UPDATE 
        SET budget_limit = 400;

        -- Renta
        INSERT INTO public.category_groups (household_id, name, color, budget_limit)
        VALUES (house_record.id, 'Renta', '#673AB7', 3000)
        ON CONFLICT (household_id, name) DO UPDATE 
        SET budget_limit = 3000;
    END LOOP;
END $$;
