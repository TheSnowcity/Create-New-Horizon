import { $MetaMachine } from "packages/com/gregtechceu/gtceu/api/machine/$MetaMachine"
import { $IMultiPart } from "packages/com/gregtechceu/gtceu/api/machine/feature/multiblock/$IMultiPart"
import { $MultiblockControllerMachine } from "packages/com/gregtechceu/gtceu/api/machine/multiblock/$MultiblockControllerMachine"
import { $WorkableElectricMultiblockMachine } from "packages/com/gregtechceu/gtceu/api/machine/multiblock/$WorkableElectricMultiblockMachine"
import { $IRecipeHandlerTrait } from "packages/com/gregtechceu/gtceu/api/machine/trait/$IRecipeHandlerTrait"
import { $GTRecipe } from "packages/com/gregtechceu/gtceu/api/recipe/$GTRecipe"
import { $GTRecipeType } from "packages/com/gregtechceu/gtceu/api/recipe/$GTRecipeType"
import { $Content } from "packages/com/gregtechceu/gtceu/api/recipe/content/$Content"
import { $GameProfile } from "packages/com/mojang/authlib/$GameProfile"
import { $UUID } from "packages/java/util/$UUID"
import { EntityType } from "packages/moe/wolfgirl/probejs/generated/registry/minecraft/EntityType"
import { $Holder } from "packages/net/minecraft/core/$Holder"
import { $StringTag } from "packages/net/minecraft/nbt/$StringTag"
import { $DamageSource } from "packages/net/minecraft/world/damagesource/$DamageSource"
import { $DamageType } from "packages/net/minecraft/world/damagesource/$DamageType"
import { $Entity } from "packages/net/minecraft/world/entity/$Entity"
import { $EntityType } from "packages/net/minecraft/world/entity/$EntityType"
import { $LivingEntity } from "packages/net/minecraft/world/entity/$LivingEntity"
import { $ItemStack } from "packages/net/minecraft/world/item/$ItemStack"
import { $LootParams$Builder } from "packages/net/minecraft/world/level/storage/loot/$LootParams$Builder"
import { $LootContextParamSet$Builder } from "packages/net/minecraft/world/level/storage/loot/parameters/$LootContextParamSet$Builder"
import { $FakePlayer } from "packages/net/minecraftforge/common/util/$FakePlayer"

function randomString(len) {
    if (len === undefined) {
        len = 32;
    }
    let strVals = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
    let maxLen = strVals.length;
    let randomStr = '';
    for (var i = 0; i < len; i++) {
        randomStr += strVals.charAt(Math.floor(Math.random() * maxLen));
    }
    return randomStr;
}

GTCEuStartupEvents.registry('gtceu:recipe_type', event => {
    event.create('slaughter_house')
        .setEUIO('in')
        .setMaxIOSize(4, 4, 2, 2)
        .setSlotOverlay(false, false, GuiTextures.SOLIDIFIER_OVERLAY)
        .setProgressBar(GuiTextures.PROGRESS_BAR_ARROW, FillDirection.LEFT_TO_RIGHT)
        .setSound(GTSoundEntries.CHEMICAL)
})
GTCEuStartupEvents.registry('gtceu:machine', event => {
    const SizedIngredient = Java.loadClass('com.gregtechceu.gtceu.api.recipe.ingredient.SizedIngredient')
    const $Registries = Java.loadClass('net.minecraft.core.registries.Registries')
    const DamageTypes = Java.loadClass('net.minecraft.world.damagesource.DamageTypes')
    const Entity = Java.loadClass('net.minecraft.world.entity.Entity')
    const ItemRecipeCapability = Java.loadClass('com.gregtechceu.gtceu.api.capability.recipe.ItemRecipeCapability')
    const ComponentPanelWidget = Java.loadClass('com.lowdragmc.lowdraglib.gui.widget.ComponentPanelWidget')
    const LootContextParams = Java.loadClass('net.minecraft.world.level.storage.loot.parameters.LootContextParams')
    const GTRecipeBuilder = Java.loadClass('com.gregtechceu.gtceu.data.recipe.builder.GTRecipeBuilder')
    const IO = Java.loadClass('com.gregtechceu.gtceu.api.capability.recipe.IO')
    let uuid1 = randomString(16)
    let uuid2 = randomString(16)
    event.create('slaughter_house', 'multiblock')
        .rotationState(RotationState.NON_Y_AXIS)
        .recipeType('slaughter_house')
        .recipeModifier((machine, recipe) => {
            let newrecipe = recipe.copy()
            let timecost = machine.getHolder().self().persistentData.getFloat('timecost')
            if (timecost == null) {
                timecost = 1
            }
            newrecipe.duration = 40 * timecost
            return newrecipe
        })
        .appearanceBlock(GTBlocks.CASING_STEEL_SOLID)
        .pattern(definition => FactoryBlockPattern.start()
            .aisle("ABBBA", "ABBBA", "CCCCC", "CCCCC", "CCCCC", "CCCCC", "ABBBA")
            .aisle("BAAAB", "BDDDB", "CDDDC", "CDDDC", "CDDDC", "CDDDC", "BAAAB")
            .aisle("BAAAB", "BD#DB", "CD#DC", "CD#DC", "CD#DC", "CD#DC", "BAEAB")
            .aisle("BAAAB", "BDDDB", "CDDDC", "CDDDC", "CDDDC", "CDDDC", "BAAAB")
            .aisle("AB@BA", "ABBBA", "CCCCC", "CCCCC", "CCCCC", "CCCCC", "ABBBA")
            .where("A", Predicates.blocks("gtceu:solid_machine_casing"))
            .where("B", Predicates.blocks("gtceu:solid_machine_casing").setMinGlobalLimited(15)
                .or(Predicates.autoAbilities(definition.getRecipeTypes()))
                .or(Predicates.abilities(PartAbility.MAINTENANCE)).setMinGlobalLimited(1)
            )
            .where("#", Predicates.any())
            .where("C", Predicates.blocks("gtceu:tempered_glass"))
            .where("D", Predicates.blocks("enderio:dark_steel_bars"))
            .where("E", Predicates.abilities(PartAbility.MUFFLER).setExactLimit(1))
            .where("@", Predicates.controller(Predicates.blocks(definition.get())))
            .build()
        )
        .onWorking((/**@type {$WorkableElectricMultiblockMachine_}*/ machine) => {
            if (machine.getRecipeLogic().getProgress() == 10) {
                let key = machine.getHolder().self().persistentData.getAllKeys()
                let /** */moblist = machine.getHolder().self().persistentData.get(key.toArray()[0])
                // moblist.forEach(mob =>{
                //     console.info(mob)
                // })
                let position = machine.pos
                let level = machine.level
                let facing = machine.frontFacing
                let blockpos = [[Direction.WEST, position.offset(2, 1, 0)],
                [Direction.EAST, position.offset(-2, 1, 0)],
                [Direction.NORTH, position.offset(0, 1, 2)],
                [Direction.SOUTH, position.offset(0, 1, -2)]]
                let itempos = position
                blockpos.forEach(pos => {
                    if (facing.equals(pos[0])) {
                        itempos = pos[1]
                        return
                    }
                })
                //战利品模式
                let lootparams = new $LootParams$Builder(level).withParameter(LootContextParams.LAST_DAMAGE_PLAYER, new $FakePlayer(level, new $GameProfile(uuid1, "slaughter"))).create(new $LootContextParamSet$Builder().build())
                let totalhealth = 0
                for (let oc = 0; oc <= machine.getTier() * 4; oc++) {
                    let index = Math.random() * moblist.length;
                    let /**@type {String}*/mob = moblist[Math.floor(index)]
                    let mobentity = $EntityType.byString(mob).get().create(level)
                    if (mobentity instanceof $LivingEntity) {
                        if (mobentity.armorValue != 0) {
                            let armor = mobentity.armorValue
                            totalhealth += mobentity.maxHealth / (20 / (armor + 20))
                        }
                        else {
                            totalhealth += mobentity.maxHealth
                        }
                    }
                    let loottable = level.getServer()
                        .getLootData()
                        .getLootTable(new ResourceLocation(mob.split(':')[0] + ":entities/" + mob.split(':')[1]))
                        .getRandomItems(lootparams)
                    loottable.forEach(itemStack => {
                        let /**@type {$GTRecipe}*/ tmp = GTRecipeBuilder.ofRaw()["outputItems(net.minecraft.world.item.ItemStack)"](itemStack).buildRawRecipe()
                        if (tmp.matchRecipe(machine).isSuccess()) {
                            tmp.handleRecipeIO(IO.OUT, machine, machine.recipeLogic.getChanceCaches())
                        }
                    });
                }
                let timecost = totalhealth / (20 * machine.getTier() * 4)
                machine.getHolder().self().persistentData.putFloat('timecost', timecost)
            }
            // }
            return true
        })
        .beforeWorking((/**@type {$MetaMachine}*/machine, recipe) => {
            let find = false
            let moblist = []
            machine.getParts().forEach((/** @type {$IMultiPart} */part) => {
                part.getRecipeHandlers().forEach((/** @type {$IRecipeHandlerTrait} */trait) => {
                    if (trait.getHandlerIO() == IO.IN) {
                        trait.getContents().forEach((contents) => {
                            if (contents instanceof $ItemStack) {
                                if (contents == 'enderio:powered_spawner') {
                                    //console.info(contents.nbt.get('BlockEntityTag').get('EntityStorage').get('Entity').get('id').toString())
                                    moblist.push(contents.nbt.get('BlockEntityTag').get('EntityStorage').get('Entity').get('id'))
                                    find = true

                                }
                            }
                        })
                    }
                })
            })
            if (find == false) {
                machine.getRecipeLogic().interruptRecipe()
                return false
            }
            machine.getHolder().self().persistentData.put("moblist", moblist)
            return true
        })

        // .additionalDisplay((/**@type {$WorkableElectricMultiblockMachine}*/machine,l) => {
        //     if (machine.isFormed()) {
        //         let isSpawn = machine.getHolder().self().persistentData.getBoolean("isSpawn")
        //         if(isSpawn == null){
        //             isSpawn = false
        //         }
        //         machine.handleDisplayClick = ((componentData,ClickData) =>{
        //             if(!ClickData.isRemote()){
        //                 if (componentData.equals("spawn_switch")) {
        //                     isSpawn = !isSpawn
        //                     machine.getHolder().self().persistentData.putBoolean('isSpawn',isSpawn)
        //                 }
        //             }
        //         })
        //         l.add(Component.literal("实体生成：")
        //         .append(ComponentPanelWidget.withButton(Component.literal("[")
        //                 .append(isSpawn ?
        //                         Component.literal("关闭") :
        //                         Component.literal("打开"))
        //                 .append(Component.literal("]")), "spawn_switch")))
        //     }
        // })
        .workableCasingRenderer('gtceu:block/casings/solid/machine_casing_solid_steel', 'gtceu:block/multiblock/implosion_compressor', false)
})


