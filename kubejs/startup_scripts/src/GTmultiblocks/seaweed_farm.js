import { $MetaMachine } from "packages/com/gregtechceu/gtceu/api/machine/$MetaMachine"
import { $GTRecipe } from "packages/com/gregtechceu/gtceu/api/recipe/$GTRecipe"
//const IKineticMachine = Java.loadClass("com.gregtechceu.gtceu.common.machine.kinetic.IKineticMachine")

GTCEuStartupEvents.registry('gtceu:recipe_type', event => {
    event.create('seaweed_farm')
        .category('ctnh')
        .setMaxIOSize(2, 4, 0, 1)
        .setSlotOverlay(false, false, GuiTextures.SOLIDIFIER_OVERLAY)
        .setProgressBar(GuiTextures.PROGRESS_BAR_ARROW, FillDirection.LEFT_TO_RIGHT)
        .setSound(GTSoundEntries.BATH)
})

GTCEuStartupEvents.registry('gtceu:machine', event => {
    event.create('seaweed_farm', 'multiblock')
        .rotationState(RotationState.NON_Y_AXIS)
        .recipeType('seaweed_farm')
        .recipeModifier((/**@type {$MetaMachine}*/ machine,/**@type {$GTRecipe}*/ recipe) => {
            const kineticMachine = machine.getParts().find(part => part instanceof IKineticMachine)
            if (kineticMachine === null) {
                return null;
            }
            let speed = kineticMachine.getKineticHolder().getSpeed()
            speed = Math.abs(speed)
            let torque = GTValues.V[kineticMachine.getTier()]
            if (torque * speed < 512) {
                return null;
            }
            let overclock_grade = kineticMachine.getTier() - 1
            let multiplerate = (speed * torque / 512) / Math.pow(2, overclock_grade)
            let newrecipe = recipe.copy()
            if (newrecipe.duration / multiplerate < 1) {
                newrecipe.duration = 1
                newrecipe.parallels = multiplerate / 200
                let GTrecipemodifier = GTRecipeModifiers.accurateParallel(machine, newrecipe, multiplerate / 200, false)
                return GTrecipemodifier.getFirst()
            }
            else {
                newrecipe.duration = newrecipe.duration / multiplerate
            }
            return newrecipe
        })
        //.appearanceBlock(() => Block.getBlock('create:andesite_casing'))
        .pattern(definition => FactoryBlockPattern.start()
            .aisle('CNNNNNC', 'CGGGGGC', 'CGGGGGC', 'CGGGGGC', 'CNNNNNC')
            .aisle('DSSSSSD', 'G#####G', 'G#####G', 'GFFFFFG', 'DBBBBBD')
            .aisle('DSSSSSD', 'G#####G', 'G#####G', 'GLLLLLG', 'EBBBBBE')
            .aisle('DSSSSSD', 'G#####G', 'G#####G', 'GFFFFFG', 'DBBBBBD')
            .aisle('CNNKNNC', 'CGGGGGC', 'CGGGGGC', 'CGGGGGC', 'CNNNNNC')
            .where('C', Predicates.blocks('create:andesite_casing'))
            .where('N', Predicates.blocks('create:andesite_casing')
                .or(Predicates.autoAbilities(definition.getRecipeTypes()))
                .or(Predicates.abilities(PartAbility.MAINTENANCE)).setMinGlobalLimited(1))
            .where('K', Predicates.controller(Predicates.blocks(definition.get())))
            .where('D', Predicates.blocks('create:andesite_casing'))
            .where('E', Predicates.abilities(PartAbility.INPUT_KINETIC).setExactLimit(1)
                .or(Predicates.blocks('create:andesite_casing')))
            .where('F', Predicates.blocks('create:mechanical_harvester'))
            .where('L', Predicates.blocks('create:andesite_casing'))
            .where('B', Predicates.blocks('minecraft:oak_planks'))
            .where('S', Predicates.blocks('minecraft:sand'))
            .where('G', Predicates.blocks('gtceu:tempered_glass'))
            .where('#', Predicates.blocks('minecraft:water'))
            .build()
        )
        .workableCasingRenderer('create:block/andesite_casing', 'gtceu:block/multiblock/coke_oven', false)
})