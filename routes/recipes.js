const express = require('express');
const session = require('express-session');
const {recipes} = require('../data');
const router = express.Router();
const data = require('../data');
const recipeData = data.recipes;
const helpers = require('../helpers');
const redis = require('redis');
const client = redis.createClient();
client.connect().then(() => {});

router
    .route('/recipes')
    .get(async (req, res)=> {
        //console.log('sending from route /recipes');
        const page_no= req.query.page || 1;
        // await client.set('thisiskey','thisisvalue')
        // let val=await client.get('thisiskey')
        // console.log('testing:-',val)
        try{
            if(isNaN(page_no)){
                throw 'page number should be valid number'
            }
            if(page_no<1){
                throw 'page number should be greater than 1';
            }
        }catch(e){
            return res.status(400).json({error: e});
        }
        try{
            const result=await recipeData.getallrecipes(page_no);
            if(result!==null){
                if(result.length!=0){
                    await client.set('/recipes_page_'+page_no,JSON.stringify(result));
                    await client.expire('/recipes_page_'+page_no,60);
                    return res.status(200).json(result);
                }else{
                    throw 'no more recipes on this page!';
                }
            }
        }catch(e){
            return res.status(404).json({error: e});
        }
        return res.status(500).send('Internal Server Error');
    })
    .post(async (req , res) => {
        let recipeInfo=req.body;
        try{

            title=recipeInfo.title;
            ingredients=recipeInfo.ingredients;
            cookingSkillRequired=recipeInfo.cookingSkillRequired;
            steps=recipeInfo.steps;

            if(!title) throw 'you must provde title';
            if(!ingredients) throw 'you mustprovide ingderients';
            if(!cookingSkillRequired) throw 'you must provide cookingskillrequired';
            if(!steps) throw 'you must provide steps';
            
            title=helpers.checkTitle(title);
            ingredients=helpers.checkIngredients(ingredients);
            cookingSkillRequired=helpers.checkcookingSkillRequired(cookingSkillRequired);
            steps=helpers.checkSteps(steps);

        }catch(e){
            return res.status(400).json({error: e});
        }
        try{
            let user_from_catch=await client.get('credentials');
            user_from_catch=JSON.parse(user_from_catch);
            userThatPosted={
                _id:user_from_catch._id,
                username:user_from_catch.username
            }
            const result=await recipeData.create_recipes(title,ingredients,cookingSkillRequired,steps,userThatPosted);
            if(result!==null){
                await client.set('/recipes/'+result._id,JSON.stringify(result));
                let checkInMostAccessed=await client.zRank('mostAccessed','/recipes/'+result._id);
                //console.log("**********",checkInMostAccessed);
                if(checkInMostAccessed!==null){
                    //console.log('found in mostaccessed');
                    await client.zIncrBy('mostAccessed',1,'/recipes/'+result._id);
                }else{
                    //console.log('not found in mostaccessed');
                    await client.zAdd('mostAccessed',{ score:1, value:'/recipes/'+result._id});
                }
                return res.status(200).json(result);
            }
        }catch(e){
            return res.status(404).json({error: e});
        }
        return res.status(500).send('Internal Server Error');
    });

router
    .route('/recipes/:id')
    .get(async (req , res) => {
        //console.log('sending from route /recipes/:id')
        try {
            if(!req.params.id) throw 'you must provide recipe ID';
            req.params.id = helpers.checkId(req.params.id);
        }catch (e){
            return res.status(400).json({error: e});
        }
        try {
            const recipe = await recipeData.getRecipeById(req.params.id);
            if(recipe!==null){
                await client.set('/recipes/'+req.params.id,JSON.stringify(recipe));
                let checkInMostAccessed=await client.zRank('mostAccessed','/recipes/'+req.params.id);
                //console.log("**********",checkInMostAccessed);
                if(checkInMostAccessed!==null){
                    //console.log('found in mostaccessed');
                    await client.zIncrBy('mostAccessed',1,'/recipes/'+req.params.id);
                }else{
                    //console.log('not found in mostaccessed');
                    await client.zAdd('mostAccessed',{ score:1, value:'/recipes/'+req.params.id });
                }
                return res.status(200).json(recipe);
            }
        }catch(e) {
            return res.status(404).json({error:e});
        }
    })
    .patch(async (req, res) => {
        let allsame=true;
        let recipeInfo=req.body;
        try {
            if(!req.params.id) throw 'you must provide recipe ID';
            req.params.id = helpers.checkId(req.params.id);
        }catch (e) {
            return res.status(400).json({error: e});
        }

        try {
            var old_recipe = await recipeData.getRecipeById(req.params.id);
            if(old_recipe==null){
                throw 'can not find the recipe with this id';
            }
        }catch(e) {
            return res.status(404).json({error:e});
        }


        try{
            let user_from_catch=await client.get('credentials');
            user_from_catch=JSON.parse(user_from_catch);
            if(old_recipe.userThatPosted.username.trim()!=user_from_catch.username.trim()){
                throw 'you cannot update this recipe. you can only update recipe posted by you';
            }
        }catch(e){
            return res.status(403).json({error:e});
        }

        try{
            title=recipeInfo.title;
            ingredients=recipeInfo.ingredients;
            cookingSkillRequired=recipeInfo.cookingSkillRequired;
            steps=recipeInfo.steps;
            if(!title && !ingredients && !cookingSkillRequired && !steps){
                throw 'you must pass atleast one parameter';
            }
            if(title!==undefined){
                title=helpers.checkTitle(title);
                if(title!=old_recipe.title){
                    allsame=false
                }
            }else{
                title=old_recipe.title;
            }

            if(ingredients!=undefined){
                ingredients=helpers.checkIngredients(ingredients);
                if(ingredients!=old_recipe.ingredients){
                    allsame=false;
                }
            }else{
                ingredients=old_recipe.ingredients;
            }

            if(cookingSkillRequired!=undefined){
                cookingSkillRequired=helpers.checkcookingSkillRequired(cookingSkillRequired);
                if(cookingSkillRequired!=old_recipe.cookingSkillRequired){
                    allsame=false;
                }
            }else{
                cookingSkillRequired=old_recipe.cookingSkillRequired;
            }

            if(steps!=undefined){
                steps=helpers.checkSteps(steps);
                if(steps!=old_recipe.steps){
                    allsame=false;

                }
            }else{
                steps=old_recipe.steps;
            }

            if(allsame){
                throw 'atleast one parameter must be diffferent from the old one!!';
            }

        }catch(e){
            return res.status(400).json({error: e});
        }


        try{
            const result=await recipeData.patchRecipe(req.params.id,title,ingredients,cookingSkillRequired,steps);
            if(result!==null){
                await client.set('/recipes/'+result._id,JSON.stringify(result));
                let checkInMostAccessed=await client.zRank('mostAccessed','/recipes/'+req.params.id);
                //console.log("**********",checkInMostAccessed);
                if(checkInMostAccessed!==null){
                    //console.log('found in mostaccessed');
                    await client.zIncrBy('mostAccessed',1,'/recipes/'+req.params.id);
                }else{
                    //console.log('not found in mostaccessed');
                    await client.zAdd('mostAccessed',{ score:1, value:'/recipes/'+req.params.id });
                }
                return res.status(200).json(result);
            }
        }catch(e){
            return res.status(404).json({error:e});
        }
    })

router
    .route('/recipes/:id/comments')
    .post(async (req, res) => {
        let commentInfo=req.body;
        try{
            if(!req.params.id) throw 'you must provide recipe ID';
            var comment=commentInfo.comment;
            var comment=helpers.checkComment(comment);
            req.params.id = helpers.checkId(req.params.id);

        }catch(e){
            return res.status(400).json({error: e});
        }
        try{
            const recipe = await recipeData.getRecipeById(req.params.id);
            if(recipe==null){
                throw 'no recipe found with this id ';
            }
            let user_from_catch=await client.get('credentials');
            user_from_catch=JSON.parse(user_from_catch);
            userThatPosted={
                _id:user_from_catch._id,
                username:user_from_catch.username
            }
            const recipe_=await recipeData.addComment(req.params.id,userThatPosted,comment);
            if(recipe_!==null){
                await client.set('/recipes/'+recipe_._id,JSON.stringify(recipe_));
                let checkInMostAccessed=await client.zRank('mostAccessed','/recipes/'+req.params.id);
                //console.log("**********",checkInMostAccessed);
                if(checkInMostAccessed!==null){
                    //console.log('found in mostaccessed');
                    await client.zIncrBy('mostAccessed',1,'/recipes/'+req.params.id);
                }else{
                    //console.log('not found in mostaccessed');
                    await client.zAdd('mostAccessed',{ score:1, value:'/recipes/'+req.params.id });
                }
                return res.status(200).json(recipe_);
            }
        }catch(e){
            return res.status(404).json({error:e});
        }
    })

router
    .route('/recipes/:id/:commentid')
    .delete(async (req, res)=> {
        try{
            if(!req.params.id) throw 'you must provide recipe ID';
            if(!req.params.commentid) throw 'you must provide comment ID';
            req.params.id = helpers.checkId(req.params.id);
            req.params.commentid = helpers.checkId(req.params.commentid);
            
        }catch(e){
            return res.status(400).json({error: e});
        }

        try{
            var re=await recipeData.getRecipeById(req.params.id);
            if(re==null) throw 'no recipe found with this id';
            var original_comment=await recipeData.getCommentByID(req.params.id,req.params.commentid); 
            if(original_comment==null) throw 'no comment found with this id';
        }catch(e){
            return res.status(404).json({error: e});
        }

        try{
            let user_from_catch=await client.get('credentials');
            user_from_catch=JSON.parse(user_from_catch);
            if(original_comment.userThatPostedComment.username.trim()!=user_from_catch.username.trim()){
                throw 'you cannot delete this comment. you can only delete comment posted by you';
            }
        }catch(e){
            return res.status(403).json({error:e});
        }

        try{
            const updated_recpe=await recipeData.deleteComment(req.params.id,req.params.commentid);
            if(updated_recpe!=null){
                await client.set('/recipes/'+updated_recpe._id,JSON.stringify(updated_recpe));
                let checkInMostAccessed=await client.zRank('mostAccessed','/recipes/'+req.params.id);
                //console.log("**********",checkInMostAccessed);
                if(checkInMostAccessed!==null){
                    //console.log('found in mostaccessed');
                    await client.zIncrBy('mostAccessed',1,'/recipes/'+req.params.id);
                }else{
                    //console.log('not found in mostaccessed');
                    await client.zAdd('mostAccessed',{ score:1, value:'/recipes/'+req.params.id });
                }
                return res.status(200).json(updated_recpe);
            }
        }catch(e){
            return res.status(404).json({error:e});
        }
    })

router
    .route('/recipes/:id/likes')
    .post(async (req,res) => {
        try {
            if(!req.params.id) throw 'you must provide recipe ID';
            req.params.id = helpers.checkId(req.params.id);
        }catch (e){
            return res.status(400).json({error: e});
        }
        try {
            const recipe = await recipeData.getRecipeById(req.params.id);
            if(recipe==null){
                throw 'no recipe found with this id ';
            }
        }catch(e) {
            return res.status(404).json({error:e});
        }
        try{
            let user_from_catch=await client.get('credentials');
            user_from_catch=JSON.parse(user_from_catch);
            const liked_recipe=await recipeData.addAndRemoveLike(req.params.id,user_from_catch._id);
            if(liked_recipe!==null){
                await client.set('/recipes/'+liked_recipe._id,JSON.stringify(liked_recipe));
                let checkInMostAccessed=await client.zRank('mostAccessed','/recipes/'+req.params.id);
                //console.log("**********",checkInMostAccessed);
                if(checkInMostAccessed!==null){
                    //console.log('found in mostaccessed');
                    await client.zIncrBy('mostAccessed',1,'/recipes/'+req.params.id);
                }else{
                    //console.log('not found in mostaccessed');
                    await client.zAdd('mostAccessed',{ score:1, value:'/recipes/'+req.params.id });
                }
                return res.status(200).json(liked_recipe);
            }
        }catch(e){
            return res.status(404).json({error:e});
        }
    })

router
    .route('/mostaccessed')
    .get(async (req,res) => {
        try{
            let result=[];
            const scores= await client.zRange('mostAccessed',0,9,{REV: true});
            //console.log('this is the score of the mostaccessed rute ******* -->>',scores);
            for (let i = 0; i < scores.length; i++) {
                let val=await client.get(scores[i]);
                result.push(JSON.parse(val))
            }
            return res.status(200).json(result);
        }catch(e){
            return res.status(400).json({error: e});
        }
    })

module.exports = router;