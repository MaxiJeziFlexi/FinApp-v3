#!/usr/bin/env python3
"""
Test script for decision tree API integration with tree_model.py
"""

import sys
import os
import asyncio
import json

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def test_decision_tree_integration():
    """Test the decision tree integration with tree_model.py"""
    
    print("Testing decision tree integration...")
    
    try:
        # Import the decision tree module
        from api.decision_tree import process_decision_tree, get_next_question
        from ai.tree_model import FinancialDecisionTree, DecisionTreeRequest
        
        print("✅ Successfully imported decision tree modules")
        
        # Test 1: Initialize the decision tree
        decision_tree = FinancialDecisionTree()
        print("✅ Successfully initialized FinancialDecisionTree")
        
        # Test 2: Test the root node
        test_request = {
            "user_id": 1,
            "current_node_id": "root",
            "answer": None,
            "context": {}
        }
        
        response = await process_decision_tree(test_request)
        print("✅ Successfully processed root node request")
        print(f"Response keys: {list(response.keys())}")
        
        if "node" in response:
            node = response["node"]
            print(f"Node ID: {node.get('id')}")
            print(f"Node type: {node.get('type')}")
            print(f"Question: {node.get('question')}")
            print(f"Options count: {len(node.get('options', []))}")
        
        # Test 3: Test answering the first question
        if "node" in response and response["node"].get("options"):
            first_option = response["node"]["options"][0]
            answer_request = {
                "user_id": 1,
                "current_node_id": "root",
                "answer": first_option["id"],
                "context": {}
            }
            
            answer_response = await process_decision_tree(answer_request)
            print("✅ Successfully processed answer to root question")
            print(f"Next node ID: {answer_response.get('node', {}).get('id')}")
        
        # Test 4: Test the question endpoint
        question_request = {
            "user_id": 1,
            "current_node_id": "root",
            "answer": None,
            "context": {}
        }
        
        question_response = await get_next_question(question_request)
        print("✅ Successfully tested question endpoint")
        print(f"Question: {question_response.get('question')}")
        
        print("\n🎉 All tests passed! Decision tree integration is working correctly.")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_tree_model_directly():
    """Test the tree model directly"""
    
    print("\nTesting tree model directly...")
    
    try:
        from ai.tree_model import FinancialDecisionTree, DecisionTreeRequest
        
        # Initialize tree
        tree = FinancialDecisionTree()
        print("✅ Tree initialized")
        
        # Test root request
        request = DecisionTreeRequest(
            user_id=1,
            current_node_id="root",
            answer=None,
            context={}
        )
        
        response = tree.process_step(request)
        print("✅ Root step processed")
        print(f"Node ID: {response.node.id}")
        print(f"Question: {response.node.question}")
        print(f"Options: {len(response.node.options)}")
        print(f"Progress: {response.progress}")
        
        # Test answering
        if response.node.options:
            first_option = response.node.options[0]["id"]
            answer_request = DecisionTreeRequest(
                user_id=1,
                current_node_id="root",
                answer=first_option,
                context={}
            )
            
            answer_response = tree.process_step(answer_request)
            print("✅ Answer processed")
            print(f"Next node: {answer_response.node.id}")
            print(f"Next question: {answer_response.node.question}")
        
        return True
        
    except Exception as e:
        print(f"❌ Tree model test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Decision Tree Integration Test")
    print("=" * 50)
    
    # Run tests
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    try:
        # Test tree model directly first
        tree_success = loop.run_until_complete(test_tree_model_directly())
        
        # Test API integration
        api_success = loop.run_until_complete(test_decision_tree_integration())
        
        if tree_success and api_success:
            print("\n🎉 All integration tests passed!")
            sys.exit(0)
        else:
            print("\n❌ Some tests failed!")
            sys.exit(1)
            
    finally:
        loop.close()